import {Router} from "express";
import { 
    getSingleUser,
    loggedOut,
    loginUser, 
    registerUser, 
    updatePassword,
    genNewToken,
    updateUser,
    updateCoverImage,
    updateAvatar,
    deleteUser,
    getUserChannelProfile
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middieware.js";
import { verifyJWT } from "../controllers/auth.controller.js";
const router =Router();

// POST METHODS
router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser)
router.route('/login').post(loginUser)
router.use(verifyJWT); // middleware will checking for all after this line

// GET METHODS
router.route('/getCurrentUser').get(getSingleUser);
router.route('/logout').get(loggedOut);
router.route('/regen-tokens').get(genNewToken);
router.route('/channel-profile/:username').get(getUserChannelProfile)
//PATCH METHODS
router.route('/change-password').patch(updatePassword);
router.route('/update-user-details').patch(updateUser);
router.route('/update-user-cover').patch(upload.single("avatar"),updateAvatar);
router.route('/update-user-coverImage').patch(upload.single("coverImage"),updateCoverImage);

// DELETE METHODS
router.route('/deleteUser').delete(deleteUser);
export default router;