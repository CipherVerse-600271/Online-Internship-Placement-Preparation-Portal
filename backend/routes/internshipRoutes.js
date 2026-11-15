const express=require("express");
const mongoose=require("mongoose");
const crypto=require("crypto");
const Internship=require("../models/Internship");
const Notification=require("../models/Notification");
const User=require("../src/models/User");
const {protect,authorize}=require("../src/middleware/authMiddleware");
const {startOfUtcDay,parseUtcDateOnly,isDeadlineOpen}=require("../src/utils/dateUtils");
const router=express.Router();
const skillsOf=value=>(Array.isArray(value)?value:String(value||"").split(",")).map(x=>String(x).trim()).filter(Boolean);
const escapeRegex=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const publicInternship=job=>{
 const value=job&&typeof job.toObject==="function"?job.toObject():{...job};
 delete value.idempotencyKey;
 delete value.idempotencyHash;
 return value;
};
const deliverMatchNotifications=async job=>{
 if(!job.matchNotificationsPending)return false;
 try{
  const students=await User.find({role:"student",skills:{$in:(job.skills||[]).map(x=>new RegExp("^"+escapeRegex(x)+"$","i"))}}).select("_id");
  for(const student of students){
   const eventKey="internship-match:"+job._id+":"+student._id;
   try{
    await Notification.updateOne({eventKey},{$setOnInsert:{eventKey,student:student._id,internship:job._id,category:"internship_match",message:"New internship match: "+job.title+" at "+job.company+". Matching skills: "+(job.skills||[]).join(", ")}}, {upsert:true,runValidators:true,setDefaultsOnInsert:true});
   }catch(error){
    if(error.code!==11000)throw error;
    if(!await Notification.exists({eventKey}))throw error;
   }
  }
  await Internship.updateOne({_id:job._id},{ $set:{matchNotificationsPending:false} });
  return false;
 }catch(error){
  console.error("Internship saved, but matching notifications remain pending:",error.message);
  return true;
 }
};
const respondWithExistingPost=async(req,res,job,requestHash)=>{
 if(String(job.recruiter)!==String(req.user._id)||job.idempotencyHash!==requestHash){
  res.status(409).json({message:"Idempotency key was already used for a different internship request."});
  return true;
 }
 const matchingNotificationsPending=await deliverMatchNotifications(job);
 const currentJob=await Internship.findById(job._id);
 res.status(200).json({message:matchingNotificationsPending?"Internship was already published; matching notifications are still pending. Retry this request with the same idempotency key.":"Internship was already published for this request.",matchingNotificationsPending,internship:publicInternship(currentJob||job)});
 return true;
};

router.get("/",async(req,res)=>{
 try{
  const {search,skill,location,minStipend,maxStipend,duration}=req.query;
  const filter={isActive:true,deadline:{$gte:startOfUtcDay()}};
  if(search&&String(search).trim()){
   const keyword=new RegExp(escapeRegex(String(search).trim()),"i");
   filter.$or=[{title:keyword},{company:keyword},{description:keyword},{skills:keyword}];
  }
  if(skill&&String(skill).trim())filter.skills={$in:skillsOf(skill).map(x=>new RegExp("^"+escapeRegex(x)+"$","i"))};
  if(location&&String(location).trim())filter.location={$regex:escapeRegex(String(location).trim()),$options:"i"};
  if(minStipend!==undefined||maxStipend!==undefined){
   filter.stipend={};
   if(minStipend!==undefined&&minStipend!==""){const min=Number(minStipend);if(!Number.isFinite(min)||min<0)return res.status(400).json({message:"Minimum stipend must be a valid non-negative number."});filter.stipend.$gte=min;}
   if(maxStipend!==undefined&&maxStipend!==""){const max=Number(maxStipend);if(!Number.isFinite(max)||max<0)return res.status(400).json({message:"Maximum stipend must be a valid non-negative number."});filter.stipend.$lte=max;}
   if(filter.stipend.$gte!==undefined&&filter.stipend.$lte!==undefined&&filter.stipend.$gte>filter.stipend.$lte)return res.status(400).json({message:"Minimum stipend cannot exceed maximum stipend."});
  }
  if(duration&&String(duration).trim())filter.duration={$regex:escapeRegex(String(duration).trim()),$options:"i"};
  res.json(await Internship.find(filter).sort({createdAt:-1}));
 }catch(error){res.status(500).json({message:"Failed to fetch internships."});}
});

router.get("/:id",async(req,res)=>{
 if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({message:"Invalid internship ID."});
 try{const job=await Internship.findOne({_id:req.params.id,isActive:true});if(!job)return res.status(404).json({message:"Internship not found or inactive."});res.json({...job.toObject(),isOpen:isDeadlineOpen(job.deadline)});}
 catch{res.status(500).json({message:"Unable to retrieve internship details."});}
});

router.post("/",protect,authorize("recruiter"),async(req,res)=>{
 try{
  if(req.user.recruiterStatus!=="approved"||!req.user.isEmailVerified)return res.status(403).json({message:"Only email-verified, approved recruiters can publish internships."});
  const idempotencyKey=String(req.get("Idempotency-Key")||"").trim();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey))return res.status(400).json({message:"A valid Idempotency-Key UUID is required."});
  const {title,company,location,stipend,duration,description,eligibility,deadline,applyLink}=req.body;
  const fields={title,company,location,stipend,duration,description,eligibility,deadline};
  const missing=Object.entries(fields).filter(([,v])=>v===undefined||v===null||String(v).trim()==="").map(([k])=>k);
  if(missing.length)return res.status(400).json({message:"Complete all required internship fields.",missing});
  if(!Number.isFinite(Number(stipend))||Number(stipend)<0)return res.status(400).json({message:"Stipend must be non-negative."});
  const due=parseUtcDateOnly(deadline);if(!due)return res.status(400).json({message:"Deadline must be a valid date."});
  let validatedApplyLink="";
  if(applyLink){
   try{const parsedUrl=new URL(applyLink);if(!["http:","https:"].includes(parsedUrl.protocol))throw new Error("Invalid protocol");validatedApplyLink=parsedUrl.toString();}
   catch{return res.status(400).json({message:"Application link must be a valid HTTP or HTTPS URL."});}
  }
  const skills=skillsOf(req.body.skills);
  const jobPayload={title:String(title).trim(),company:String(company).trim(),location:String(location).trim(),stipend:Number(stipend),duration:String(duration).trim(),description:String(description).trim(),eligibility:String(eligibility).trim(),deadline:due.toISOString(),skills,applyLink:validatedApplyLink};
  const requestHash=crypto.createHash("sha256").update(JSON.stringify(jobPayload)).digest("hex");
  const existing=await Internship.findOne({idempotencyKey}).select("+idempotencyHash");
  if(existing)return respondWithExistingPost(req,res,existing,requestHash);
  if(due<startOfUtcDay())return res.status(400).json({message:"Deadline must be a valid current or future date."});
  let job;
  try{
   job=await Internship.create({...jobPayload,deadline:due,recruiter:req.user._id,idempotencyKey,idempotencyHash:requestHash,matchNotificationsPending:skills.length>0});
  }catch(error){
   if(error.code===11000){
    const raced=await Internship.findOne({idempotencyKey}).select("+idempotencyHash");
    if(raced)return respondWithExistingPost(req,res,raced,requestHash);
   }
   throw error;
  }
  const matchingNotificationsPending=await deliverMatchNotifications(job);
  const savedJob=await Internship.findById(job._id);
  res.status(201).json({message:matchingNotificationsPending?"Internship published, but matching notifications are pending. Retry this request with the same idempotency key.":"Internship published successfully.",matchingNotificationsPending,internship:publicInternship(savedJob||job)});
 }catch(error){res.status(400).json({message:"Unable to publish internship.",error:error.message});}
});
module.exports=router;
