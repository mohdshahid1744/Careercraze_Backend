import userModel,{IUser} from "../models/userModel";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import JobModel from "../models/jobModel";
import bcrypt from 'bcryptjs'
import dotenv from "dotenv";
import recruiterModel from "../models/recruiterModel";
import SaveJobModel from "../models/saveJobModel";
import ChatModel from "../models/chatModel";
dotenv.config();

interface User{
    name:string,
    email:string,
    mobile:string,
    password:string,
    isActive?:boolean,
    avatar?: string;
}
interface Login{
    email:string,
    password:string
}

let access_key = process.env.USER_ACCESS_KEY;
let secret_key = process.env.USER_SECRET_KEY;
let bucket_name = process.env.BUCKET_NAME;

const s3: S3Client = new S3Client({
  credentials: {
    accessKeyId: access_key || '',
    secretAccessKey: secret_key || ''
  },
  region: process.env.BUCKET_REGION
});

const findUser = async (email: string) => {
  console.log(email, "user find repo");

  try {
    return await userModel.findOne({ email: email });
  } catch (error) {
    console.log(error);
  }
};

const createUser = async (userdatas: Partial<IUser>) => {
  try {
    const latest = userdatas;
    console.log(latest, 'latseeetetet', typeof (userdatas));
    const email = userdatas.email;
    console.log("Emailll", email);

    let created = await userModel.create({
      name: userdatas.name,
      email: userdatas.email,
      mobile: userdatas.mobile,
      password: userdatas.password
    });
    await created.save();
    const userdata = await userModel.findOne({ email: userdatas.email })
    const getObjectParams = {
        Bucket: bucket_name,
        Key: userdata?.avatar,
    }
    const getObjectCommand = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
    if (userdata) {
        userdata.avatar = url
    }
    const getBannerParams = {
      Bucket: bucket_name,
      Key: userdata?.banner,
  }
  const getBannerCommand = new GetObjectCommand(getBannerParams);
  const url2 = await getSignedUrl(s3, getBannerCommand, { expiresIn: 3600 });
  if (userdata) {
      userdata.banner = url2
  }
    return userdata
  } catch (err) {
    console.error("Error creating", err);
  }
};

const validateUser = async (userdata: Login) => {
  try {
    const user = await userModel.findOne({ email: userdata.email });
    if (!user) {
      console.log('User not found');
      return { success: false, message: 'User not found' };
    }
    if (user.isActive === false) {
      console.log('User is inactive');
      return { success: false, message: 'User is inactive' };
    }
    const passwordMatch = await user.matchPassword(userdata.password);
    if (passwordMatch) {
      return { success: true, isAdmin: user.isAdmin, user };
    } else {
      console.log('Incorrect password');
      return { success: false, message: 'Incorrect password' };
    }
  } catch (err) {
    console.error('Error validating user:', err);
    return { success: false, message: 'Error validating user' };
  }
};




const findById = async (userId: string) => {
  try {
    let user = await userModel.findOne({ _id: userId })
    return user
  } catch (err) {
    console.error("Error while getting user", err);
  }
};
const getUser=async(id:string)=>{
  try {
    let user = await userModel.findOne({ _id: id })
    const getObjectParams = {
        Bucket: bucket_name,
        Key: user?.avatar,
    }
    const getObjectCommand = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
    if (user) {
        user.avatar = url
    }
    const getBannerParams = {
      Bucket: bucket_name,
      Key: user?.banner,
  }
  const getBannerCommand = new GetObjectCommand(getBannerParams);
  const url2 = await getSignedUrl(s3, getBannerCommand, { expiresIn: 3600 });
  if (user) {
      user.banner = url2
  }

    return user
} catch (err) {
    console.error(`Error on getting user status: ${err}`);
    return null;
}
}
const updateProfile=async(userId:string,image:string)=>{
  try {
    let response = await userModel.updateOne({ _id: userId }, { $set: { avatar: image } })
    if (response.modifiedCount > 0) {
        return { success: true, message: 'Profile Image updated successfully' };
    } else {
        return { success: false, message: 'No image was updated' };
    }

} catch (err) {
    console.error(`Error on user cover: ${err}`);
    return null;
}
}
const profileData=async(userId:string,mobile:string,title:string,name:string)=>{
  try {
    let response=await userModel.updateOne({_id:userId},{$set:{mobile:mobile,title:title,name:name}})
    if (response.modifiedCount > 0) {
      return { success: true, message: 'Profile Data updated successfully' };
  } else {
      return { success: false, message: 'No image was updated' };
  }

} catch (err) {
  console.error(`Error on user cover: ${err}`);
  return null;
}
}
const educationData = async (
  userId: string,
  school: string,
  degree: string,
  field: string,
  started: string,
  ended: string
) => {
  try {
    
    let response = await userModel.updateOne(
      { _id: userId },
      { $push: { 
          education: { 
            school: school, 
            degree: degree, 
            field: field, 
            started: started, 
            ended: ended 
          } 
        } 
      },
      { upsert: true } 
    );
    
    console.log("Response from educationData:", response);

    if (response.modifiedCount > 0 || response.upsertedCount > 0) {
      return { success: true, message: 'Profile Data updated successfully', response };
    } else {
      return { success: false, message: 'No image was updated' };
    }
  } catch (err) {
    console.error(`Error on user cover: ${err}`);
    return null;
  }
};



const skillData = async (userId: string, skill: string) => {
  try {
    const user = await userModel.findById(userId);
console.log("USERSADSA",user);

    if (!user) {
      return { success: false, message: 'User not found' };
    }
if(user.skills){

  const skillExists = user.skills.some((s: any) => s.skill === skill);
  if (skillExists) {
    return { status:403,success: false, message: 'Skill already added' };
  }
  const response = await userModel.updateOne(
    { _id: userId },
    { $push: { skills: { skill: skill } } },
    { upsert: true }
  );

  console.log("REPO", response);
  if (response.modifiedCount > 0) {
    return { success: true, message: 'Skill data updated successfully', response };
  } else {
    return { success: false, message: 'Skill data not updated' };
  }
}

  } catch (err) {
    console.error(`Error on skill data: ${err}`);
    return { success: false, message: 'Server error' };
  }
};

const updateSkill = async (userId: string, skillId: string, newSkill: string) => {
  try {
    const response = await userModel.updateOne(
      { _id: userId, "skills._id": skillId },
      { $set: { "skills.$.skill": newSkill } }
    );
    console.log("Skill Updated:", response);

    if (response.modifiedCount > 0) {
      return { success: true, message: 'Skill updated successfully' };
    } else {
      return { success: false, message: 'Skill not updated' };
    }
  } catch (err) {
    console.error(`Error updating skill: ${err}`);
    return { success: false, message: 'Error updating skill' };
  }
};

const experienceData=async(userId:string,company:string,role:string,started:string,ended:string)=>{
  try {
    const response=await userModel.updateOne({_id:userId},{$push:{experience:{company:company,role:role,started:started,ended:ended}}},{ upsert: true } )
    console.log("ASD",response);
    
    if (response.modifiedCount > 0) {
      return { success: true, message: 'Experience Data updated successfully',response };
  } else {
      return { success: false, message: 'Experience data not updated' };
  }
  }  catch (err) {
    console.error(`Error on Experience data: ${err}`);
    return null;
  }
}
export interface UserData {
  jobid: string;
  userId: string;
  name: string;
  email: string;
  mobile: string;
  cv: string;
}
const saveApplication=async(data:UserData)=>{
  try {
    const applicant={
      userId:data.userId,
      name:data.name,
      email:data.email,
      mobile:data.mobile,
      cv:data.cv
    }
    console.log("APPLICATION FORM",applicant);
    let job=await JobModel.findOne({_id:data.jobid})
    let response = await JobModel.updateOne({ _id: data.jobid }, { $addToSet: { applicants: applicant } })
    console.log(response, data, 'repo00000', job);

    if (response.modifiedCount == 0) {
        throw new Error('No documents were matched or modified during update operation.');
    }
    return true
    
  } catch (error) {
    console.error('Error while saving Applicants:', error)
    throw error
  }
}
const updateCover=async(userId:string,image:string)=>{
  try {
    let response=await userModel.updateOne({_id:userId},{$set:{banner:image}})
    if (response.modifiedCount > 0) {
      return { success: true, message: 'Banner Image updated successfully' };
  } else {
      return { success: false, message: 'No image was updated' };
  }

} catch (err) {
  console.error(`Error on user cover: ${err}`);
  return null;
}
}
const searchUser=async(text:string)=>{
  try {
    if (text.trim() == '') {
        let users: never[] = []
        return { users };
    }
    const regex = new RegExp(text, 'i');
    const users = await userModel.find({
        name: regex
    });
    const recruiters = await recruiterModel.find({
      name: regex
  });
    for (let user of users) {
        const getObjectParams = {
            Bucket: bucket_name,
            Key: user.avatar,
        }

        const getObjectCommand = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
        user.avatar = url
    }
    console.log(users, 'in repos');
    for (let recruiter of recruiters) {
      const getObjectParams = {
          Bucket: bucket_name,
          Key: recruiter.avatar,
      }

      const getObjectCommand = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
      recruiter.avatar = url
  }

    return { users,recruiters };
} catch (err) {
    console.error(`Error finding searching user: ${err}`);
    return null;
}
  }

const getFollowers=async(userId:string)=>{
  try {
    const user = await userModel.findOne({ _id: userId });
    if (user) {
        const followings = user.following || [];
        const followers = user.followers || [];
        return { followings, followers };
    } else {
        return { followings: [] };
    }
} catch (err) {
    console.error(`Error finding user by email: ${err}`);
    return null;
}
}
const follow=async(userId:string,guestId:string)=>{
  try {
    let following=await userModel.updateOne({_id:userId},{$addToSet:{following:guestId}})
    let followers=await userModel.updateOne({_id:guestId},{$addToSet:{followers:userId}})
    if (following.modifiedCount === 1 && followers.modifiedCount === 1) {
      return { success: true, message: 'Followed successfully' };
  } else {

      throw new Error('Failed to update followings and/or followers');
  }
  }  catch (err) {
    console.error(`Error finding following user: ${err}`);
    return null;
}
}
const unfollow=async(userId:string,guestId:string)=>{
  try {
    let following=await userModel.updateOne({_id:userId},{$pull:{following:guestId}})
    let followers=await userModel.updateOne({_id:guestId},{$pull:{followers:userId}})
    if (following.modifiedCount === 1 && followers.modifiedCount === 1) {
      return { success: true, message: 'unFollowed successfully' };
  } else {

      throw new Error('Failed to update followings and/or followers');
  }
  } catch (err) {
    console.error(`Error finding unfollowing user: ${err}`);
    return null;
}
}
const logout=async(userId:string)=>{
  try {
    const user=await userModel.findById(userId)
    if(user){
      user.lastSeen = new Date().toISOString();
      await user.save();
      return user
    }else{
      throw new Error('Failed to update last seen');
    }
  }  catch (err) {
    console.error(`Error finding last seen: ${err}`);
    return null;
}
}
const saveJob = async ( userId:string,jobId: string) => {
  try {
      const job = await JobModel.findById(jobId);
      if (!job) {
          throw new Error("Job not found");
      }
      const existJob=await SaveJobModel.findOne({ userId, jobId });
      if (existJob) {
        console.log("Job already exists");
        return { message: "Job is already saved", job: null };
      }
      const savedJob = new SaveJobModel({
        userId,
        jobId: job._id,
        jobrole: job.jobrole,
        companyname: job.companyname,
        joblocation: job.joblocation,
        companylogo: job.companylogo,
    });
    const indexes = await SaveJobModel.collection.getIndexes();
    console.log("Indexes:", indexes)
      await savedJob.save();
      console.log("Job saved successfully:", savedJob);

      return {message: "Job is successfully saved",savedJob};
  } catch (error) {
      console.error("Error saving job:", error);
      throw error;
  }
}
const getallSavedJob = async () => {
  try {
    const response=await SaveJobModel.find()
    return response
  } catch (error) {
    console.error("Error getting saved job:", error);
    throw error;
}
};
const removeSavedJob=async(savedId:string)=>{
  try {
    const response=await SaveJobModel.findByIdAndDelete({_id:savedId})
    return response
  }catch (error) {
    console.error("Error deleting saved job:", error);
    throw error;
}
}
const getChartDetails=async(currentYear:number , month:number)=>{
  try {
    const userStats = await userModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: [{ $year: "$createdAt" }, currentYear]
                }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: "$createdAt" },
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: {
                "_id.month": 1
            }
        },
        {
            $project: {
                _id: 0,
                month: "$_id.month",
                count: 1
            }
        }

    ])
    const result = Array.from({ length: month + 1 }, (_, i) => ({
        month: i + 1,
        count: 0
    }));
    userStats.forEach(stat => {
        const index = result.findIndex(r => r.month == stat.month);
        if (index !== -1) {
            result[index].count = stat.count;
        }
    });
    let count = await userModel.find({ isAdmin: false }).countDocuments()
    return { result, count }
} catch (err) {
    console.error(`Error fetching chart: ${err}`);
    return null;
}
}

export default {
  findUser,
  createUser,
  validateUser,
  findById,
  getUser,
  updateProfile,
  educationData,
  skillData,
  profileData,
  experienceData,
  saveApplication,
  updateSkill,
  updateCover,
  searchUser,
  follow,
  unfollow,
  getFollowers,
  logout,
  saveJob,
  getallSavedJob,
  removeSavedJob,
  getChartDetails
};
