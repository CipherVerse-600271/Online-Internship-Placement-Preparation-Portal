const express=require("express");
const mongoose=require("mongoose");
const Internship=require("../models/Internship");
const Notification=require("../models/Notification");
const User=require("../src/models/User");
const {protect,authorize}=require("../src/middleware/authMiddleware");
const router=express.Router();
const skillsOf=value=>(Array.isArray(value)?value:String(value||"").split(",")).map(x=>String(x).trim()).filter(Boolean);

router.get("/",async(req,res)=>{
 try{
  const {search,skill,location,minStipend,maxStipend,duration}=req.query;
  const filter={isActive:true,deadline:{$gte:new Date()}};
  if(search)filter.$or=[{title:{$regex:search,$options:"i"}},{company:{$regex:search,$options:"i"}},{description:{$regex:search,$options:"i"}},{skills:{$regex:search,$options:"i"}}];
  if(skill)filter.skills={$in:skillsOf(skill).map(x=>new RegExp("^"+x+"$","i"))};
  if(location)filter.location={$regex:location,$options:"i"};
  if(minStipend!==undefined||maxStipend!==undefined){filter.stipend={};if(minStipend!=="")filter.stipend.$gte=Math.max(0,Number(minStipend));if(maxStipend!=="")filter.stipend.$lte=Math.max(0,Number(maxStipend));}
  if(duration)filter.duration={$regex:duration,$options:"i"};
  res.json(await Internship.find(filter).sort({createdAt:-1}));
 }catch(error){res.status(500).json({message:"Failed to fetch internships."});}
});

router.get("/:id",async(req,res)=>{
 if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({message:"Invalid internship ID."});
 try{const job=await Internship.findOne({_id:req.params.id,isActive:true});if(!job)return res.status(404).json({message:"Internship not found or inactive."});res.json({...job.toObject(),isOpen:job.deadline>=new Date()});}
 catch{res.status(500).json({message:"Unable to retrieve internship details."});}
});

router.post("/",protect,authorize("recruiter"),async(req,res)=>{
 try{
  if(req.user.recruiterStatus!=="approved"||!req.user.isEmailVerified)return res.status(403).json({message:"Only email-verified, approved recruiters can publish internships."});
  const {title,company,location,stipend,duration,description,eligibility,deadline}=req.body;
  const fields={title,company,location,stipend,duration,description,eligibility,deadline};
  const missing=Object.entries(fields).filter(([,v])=>v===undefined||v===null||String(v).trim()==="").map(([k])=>k);
  if(missing.length)return res.status(400).json({message:"Complete all required internship fields.",missing});
  if(!Number.isFinite(Number(stipend))||Number(stipend)<0)return res.status(400).json({message:"Stipend must be non-negative."});
  const due=new Date(deadline);if(Number.isNaN(due.getTime())||due<=new Date())return res.status(400).json({message:"Deadline must be a future date."});
  const skills=skillsOf(req.body.skills);
  const job=await Internship.create({title,company,location,stipend:Number(stipend),duration,description,eligibility,deadline:due,skills,recruiter:req.user._id});
  if(skills.length){
   const students=await User.find({role:"student",skills:{$in:skills.map(x=>new RegExp("^"+x+"$","i"))}}).select("_id");
   if(students.length)await Notification.insertMany(students.map(s=>({student:s._id,internship:job._id,category:"internship_match",message:"New internship match: "+job.title+" at "+job.company+". Matching skills: "+skills.join(", ")})));
  }
  res.status(201).json({message:"Internship published successfully.",internship:job});
 }catch(error){res.status(400).json({message:"Unable to publish internship.",error:error.message});}
});
module.exports=router;
