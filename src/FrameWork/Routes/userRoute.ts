import express from 'express'
const router = express.Router()
import userController from '../../controller/userController'
import multer from 'multer'


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
router.post('/signup_submit',userController.signupSubmit)
router.patch('/verifyOtp',userController.verifyOtp)
router.post('/resendOTP',userController.resendOtp)
router.post('/login_submit',userController.loginSubmit)
router.post("/google-login", userController.googleAuth);
router.get('/usercount',userController.getUserCount)
router.get('/users', userController.getAllUsers)
router.put('/user/:email', userController.updateUserStatus);
router.put('/updateProfile/:id',upload.single("avatar"), userController.updateProfile)
router.put('/updateEducation/:id', userController.updateEducation)
router.put('/updateExperience/:id', userController.updateExperience)
router.put('/updateSkill/:id', userController.updateSkills)
router.put('/editSkill/:userId/:skillId',userController.editSkills);
router.delete('/deleteSkill/:userId/:skillId', userController.deleteSkill);
router.delete('/deleteEducation/:userId/:eduId', userController.deleteEducation);
router.delete('/deleteExperience/:userId/:expId', userController.deleteExperience);
router.put('/editEducation/:userId/:eduId',userController.editEducation);
router.put('/editExperience/:userId/:expId',userController.editExperience);
router.put('/updateProfileData/:id', userController.updateProfileData)
router.get('/getuser/:id', userController.getUser)
router.post('/applyjob',  upload.single("cv"), userController.applyApplication); 
export default router            