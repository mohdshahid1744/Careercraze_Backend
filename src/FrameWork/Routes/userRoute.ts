import express from 'express'
const router = express.Router()
import userController from '../../controller/userController'
import postController from '../../controller/postController'
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
router.get('/userstatus/:email', userController.getStatus);
router.put('/updateProfile/:id',upload.single("avatar"), userController.updateProfile)
router.put('/updateBanner/:id',upload.single("banner"), userController.updateBanner)
router.put('/updateEducation/:id', userController.updateEducation)
router.put('/updateExperience/:id', userController.updateExperience)
router.put('/updateSkill/:id', userController.updateSkills)
router.put('/editSkill/:userId/:skillId',userController.editSkills);
router.delete('/deleteSkill/:userId/:skillId', userController.deleteSkill);
router.delete('/deleteEducation/:userId/:eduId', userController.deleteEducation);
router.delete('/deleteExperience/:userId/:expId', userController.deleteExperience);
router.put('/editEducation/:userId/:eduId',userController.editEducation);
router.put('/editExperience/:userId/:expId',userController.editExperience);
router.put('/updateProfileData/:userId', userController.updateProfileData)
router.get('/getuser/:id', userController.getUser)
router.post('/applyjob',  upload.single("cv"), userController.applyApplication); 
router.post('/addskills',userController.addSkills)
router.get('/getskills',userController.getSkills)
router.put('/editedskill/:id',userController.editAdminSkills)
router.delete('/deleteskilled/:id', userController.deleteAdminSkill);
router.post('/createpost/:userId',upload.single("image"),postController.createPost)
router.get('/getpost/:userId',postController.getUserPost)
router.get('/getAllPost',postController.getAllPost)
router.post('/like', postController.likePost)
router.post('/dislike', postController.dislikePost)
router.post('/comment', postController.commentPost)
router.get('/getcomment/:postId', postController.getAllComments)
router.get('/searchuser', userController.searchUser)
router.get('/follow/:userId/:guestId', userController.follow)
router.get('/unfollow/:userId/:guestId', userController.unfollow)
router.post('/delete', postController.deletePost)
router.put('/edit/:postId',postController.editPost)
router.post('/report', postController.reportPost)
export default router            