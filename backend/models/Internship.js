const mongoose = require("mongoose");
const internshipSchema = new mongoose.Schema({
 title:{type:String,required:true,trim:true,maxlength:120},
 company:{type:String,required:true,trim:true,maxlength:120},
 location:{type:String,required:true,trim:true},
 stipend:{type:Number,required:true,min:0},
 duration:{type:String,required:true,trim:true},
 description:{type:String,required:true,trim:true,maxlength:5000},
 eligibility:{type:String,required:true,trim:true,maxlength:2000},
 skills:{type:[String],default:[]},
 applyLink:{type:String,default:""},
 recruiter:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
 deadline:{type:Date,required:true},
 isActive:{type:Boolean,default:true,index:true},
 idempotencyKey:{type:String,default:undefined,unique:true,sparse:true,select:false},
 idempotencyHash:{type:String,default:undefined,select:false},
 matchNotificationsPending:{type:Boolean,default:false}
},{timestamps:true});
module.exports=mongoose.model("Internship",internshipSchema);
