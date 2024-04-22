import {Router} from "express";
import { getSingleUser, loggedOut, loginUser, registerUser, updatePassword } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middieware.js";
import { verifyJWT } from "../controllers/auth.controller.js";
const router =Router();

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

router.route('/get-details').get(getSingleUser);

router.route('/change-password').post(updatePassword);
router.route('/logout').get(loggedOut);

export default router;