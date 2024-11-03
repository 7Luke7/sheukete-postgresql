import express from "express"
import { register_xelosani, register_damkveti, login, change_user_password } from "../controllers/authentication.js"
import { find_user_by_phone_email, get_email_by_profId } from "../controllers/xelosani/search/find.js"
import { get_account } from "../controllers/account/get_account.js"
import { modify_sensitive_xelosani_fields } from "../controllers/account/modify_account.js"
import { get_targeted_notification_devices, update_notification_devices } from "../controllers/account/notification_devices.js"
import { get_xelosani_privacy, update_xelosani_privacy } from "../controllers/account/privacy.js"
import { 
    get_xelosani_step_data, get_xelosani,
    get_xelosani_step_percent, handle_xelosani_about, update_xelosani_age,
    update_xelosani_gender, insert_xelosani_skills, insert_xelosani_schedule, insert_xelosani_service, 
    update_xelosani_phone, update_xelosani_email, check_xelosani_skills, 
    check_xelosani_contact,
    check_xelosani_age,
    check_xelosani_gender,
    check_xelosani_schedule,
    check_xelosani_location,
    check_xelosani_about
}
from "../controllers/xelosani/get_xelosani.js"
import { get_tiles } from "../controllers/location/tiles.js"
const router = express.Router()

// Authentication Management
router.route("/xelosani/register").post(register_xelosani)
router.route("/damkveti/register").post(register_damkveti)
router.route("/login").post(login)
router.route("/user/find_by_phone_email").post(find_user_by_phone_email)
router.route("/user/find_email_by_profId/:profId").get(get_email_by_profId)
router.route("/user/password/:profId").put(change_user_password)

// Account Management
router.route("/xelosani/account").post(get_account).put(modify_sensitive_xelosani_fields)
router.route("/xelosani/notification_targets").post(get_targeted_notification_devices).put(update_notification_devices)
router.route("/xelosani/privacy").post(get_xelosani_privacy).put(update_xelosani_privacy)

// Get user
router.route("/xelosani/:profId").get(get_xelosani)

// Xelosani setup
router.route("/xelosani/about/:profId").get(check_xelosani_about).put(handle_xelosani_about)
router.route("/xelosani/step_percent/:profId").get(get_xelosani_step_percent)
router.route("/xelosani/get_step_data/:profId").get(get_xelosani_step_data)
router.route("/xelosani/check_contact/:profId").get(check_xelosani_contact)
router.route("/xelosani/update_email/:profId").put(update_xelosani_email)
router.route("/xelosani/update_phone/:profId").put(update_xelosani_phone)
router.route("/xelosani/update_date/:profId").put(update_xelosani_age)
router.route("/xelosani/check_date/:profId").get(check_xelosani_age)
router.route("/xelosani/check_gender/:profId").get(check_xelosani_gender)
router.route("/xelosani/update_gender/:profId").put(update_xelosani_gender)
router.route("/xelosani/check_skills/:profId").get(check_xelosani_skills)
router.route("/xelosani/insert_skills/:profId").post(insert_xelosani_skills)
router.route("/xelosani/check_schedule/:profId").get(check_xelosani_schedule)
router.route("/xelosani/insert_schedule/:profId").post(insert_xelosani_schedule)
router.route("/xelosani/insert_service/:profId").post(insert_xelosani_service)
router.route("/xelosani/check_location/:profId").get(check_xelosani_location)

// Map Management
router.route("/get_tiles").get(get_tiles)
export default router