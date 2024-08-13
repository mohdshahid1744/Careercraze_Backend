import express from 'express'
const router = express.Router()
import userController from '../../controller/userController'
import postController from '../../controller/postController'
import multer from 'multer'
import messageController from '../../controller/messageController'
import userJwt from '../../Middleware/JWT/userJwt'


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
router.post('/signup_submit',userController.signupSubmit)
router.patch('/verifyOtp',userController.verifyOtp)
router.post('/resendOTP',userController.resendOtp)
router.post('/login_submit',userController.loginSubmit)
router.post("/google-login", userController.googleAuth);
router.get('/usercount',userController.getUserCount)
router.get('/users',userController.getAllUsers)
router.put('/user/:email',userController.updateUserStatus);
router.get('/userstatus/:email',userController.getStatus);
router.put('/updateProfile/:id',upload.single("avatar"),userJwt.verifyJwtUser, userController.updateProfile)
router.put('/updateBanner/:id',upload.single("banner"),userJwt.verifyJwtUser,userController.updateBanner)
router.put('/updateEducation/:id',userJwt.verifyJwtUser, userController.updateEducation)
router.put('/updateExperience/:id',userJwt.verifyJwtUser, userController.updateExperience)
router.put('/updateSkill/:id',userJwt.verifyJwtUser, userController.updateSkills)
router.put('/editSkill/:userId/:skillId',userJwt.verifyJwtUser,userController.editSkills);
router.delete('/deleteSkill/:userId/:skillId',userJwt.verifyJwtUser, userController.deleteSkill);
router.delete('/deleteEducation/:userId/:eduId',userJwt.verifyJwtUser, userController.deleteEducation);
router.delete('/deleteExperience/:userId/:expId',userJwt.verifyJwtUser, userController.deleteExperience);
router.put('/editEducation/:userId/:eduId',userJwt.verifyJwtUser,userController.editEducation);
router.put('/editExperience/:userId/:expId',userJwt.verifyJwtUser,userController.editExperience);
router.put('/updateProfileData/:userId',userJwt.verifyJwtUser, userController.updateProfileData)
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
router.post('/comment',upload.single("avatar"), postController.commentPost)
router.post('/replycomment', postController.replyComment)
router.get('/getcomment/:postId', postController.getAllComments)
router.get('/searchuser', userController.searchUser)
router.get('/getfollower/:id',userController.getFollowers)
router.get('/follow/:userId/:guestId', userController.follow)
router.get('/unfollow/:userId/:guestId', userController.unfollow)
router.post('/delete', postController.deletePost)
router.put('/edit/:postId',postController.editPost)
router.post('/report', postController.reportPost)
router.post('/chat',upload.single("file"), messageController.sendMessage)
router.get('/getmessage/:chatId', messageController.getMessage)
router.delete('/deletechat/:chatId', messageController.deleteMessage)
router.get('/createchat/:userId/:guestId', messageController.createChat) 
router.get('/getchat/:userId', messageController.getChatList)
router.delete('/deletecomment', postController.deleteComments)
router.put('/editmessage',messageController.editMessage)
router.post('/logout',userController.logout)
router.post('/savejob',userController.saveJob)
router.get('/getsavejob',userController.getAllSavedJob)
router.delete('/deletesavejob/:savedId', userController.removeSavedJob)
router.get('/getuserchart', userController.getUserChart)
router.get('/postchart', postController.getPostChart)
router.get('/getlastseen', userController.getLastSeen)

export default router            