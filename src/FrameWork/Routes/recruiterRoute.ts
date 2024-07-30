import express from "express";
const router=express.Router()
import recruiterController from "../../controller/recruiterController";
import multer from 'multer'


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


router.post('/recSignup',recruiterController.recruiterSignup)
router.patch('/recVerifyotp',recruiterController.verifyOTP)
router.post('/recResendOTP',recruiterController.resendOTP)
router.post('/recLogin',recruiterController.loginSubmit)
router.get('/count',recruiterController.getRecruiterCount)
router.get('/all',recruiterController.getAll)
router.put('/update/:email', recruiterController.updateStatus);
router.put('/verify/:email', recruiterController.updateVerification);
router.get('/showverify/:userId', recruiterController.getStatus);
router.post('/createjob',upload.single("companylogo"),recruiterController.createJob)
router.get('/getjob/:userId', recruiterController.getJob);
router.get('/getjoball', recruiterController.getalljob);
router.post("/google-login", recruiterController.googleAuth);
router.get('/getsingle/:id', recruiterController.getSingle);
router.delete('/deletejob',recruiterController.deleteJob)
router.post("/update/:id", upload.single("companylogo"), recruiterController.updateJob);
router.get('/candidates/:jobid', recruiterController.getCandidate);
router.get('/getrecruiter/:id', recruiterController.getRecruiter)
router.put('/updateProfile/:id',upload.single("avatar"), recruiterController.updateProfile)
router.put('/updateProfileData/:userId', recruiterController.updateProfileData)
router.post('/searchjob',  recruiterController.searchJob)
router.get('/getPdf', recruiterController.getPdf)
router.get('/searchrecruiter', recruiterController.searchRecruiter)
router.get('/follow/:userId/:guestId', recruiterController.follow)
router.get('/unfollow/:userId/:guestId', recruiterController.unfollow)
export default router       