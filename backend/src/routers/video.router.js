import { Router } from "express";
import {upload} from "../middlewares/multer.middieware.js"
import { 
    publishAVideo,
    getVideoById,
    getAllVideos,
    deleteVideo,
    updateVideo,
    togglePublishStatus
 } from "../controllers/video.controller.js";
const router = Router();


router.route('/uploadVideo').post(upload.fields([
    {
        name:"videoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishAVideo)

router.route('/get-video/:videoId').get(getVideoById)
router.route('/getAllVideos').get(getAllVideos)
router.route('/change-published-status/:videoId').get(togglePublishStatus)

// --------------------  DELETE METHOD -----------------
router.route('/delete-video/:videoId').delete(deleteVideo)

// --------------------  DELETE METHOD -----------------
router.route('/update-video-details/:videoId').post(upload.single('thumbnail'),updateVideo)
export default router;