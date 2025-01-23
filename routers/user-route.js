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
    update_xelosani_gender, insert_xelosani_skills, insert_xelosani_schedule, 
    update_xelosani_phone, update_xelosani_email, check_xelosani_skills, 
    check_xelosani_contact,
    check_xelosani_age,
    check_xelosani_gender,
    get_xelosani_not_authorized,
    check_xelosani_schedule,
    check_xelosani_about,
    modify_xelosani_age,
    modify_xelosani_schedule,
    modify_xelosani_skills,
    modify_xelosani_about,
    increment_xelosani_step_percent,
    mark_user_as_setup_done
}
from "../controllers/xelosani/get_xelosani.js"
import { get_tiles } from "../controllers/location/tiles.js"
import { check_xelosani_location } from "../controllers/location/xelosani.js"
import { get_damkveti } from "../controllers/damkveti/damkveti-controller.js"
import { add_service, update_service, get_xelosani_service, get_xelosani_services_profile_page } from "../controllers/xelosani/service/service.js"
import { send_xelosani_friend_request, friend_request_status, cancel_friend_request, get_pending_and_other_user_accepted_friend_requests, accept_friend_request } from "../controllers/friends.js"
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
router.route("/xelosani/check_schedule/:userId").get(check_xelosani_schedule)
router.route("/xelosani/insert_schedule").post(insert_xelosani_schedule)
router.route("/xelosani/check_location/:profId").get(check_xelosani_location)
router.route("/xelosani/modify_xelosani_age/:profId").put(modify_xelosani_age)
router.route("/xelosani/modify_xelosani_schedule").put(modify_xelosani_schedule)
router.route("/xelosani/modify_xelosani_skills").put(modify_xelosani_skills)
router.route("/xelosani/modify_xelosani_about").put(modify_xelosani_about)
router.route("/xelosani/increment_step_percent/:profId").post(increment_xelosani_step_percent)
router.route("/xelosani/setup_done/:profId").get(mark_user_as_setup_done)
router.route("/xelosani/not_authorized/:profId").get(get_xelosani_not_authorized)

// FRIENDS

router.route("/xelosani/friend/cancel/:requestId").delete(cancel_friend_request)
router.route("/xelosani/friend/send/:targetId").get(send_xelosani_friend_request)
router.route("/xelosani/friend/accept/:requestId").get(accept_friend_request)
router.route("/xelosani/friend/request/:profId/status").get(friend_request_status)
router.route("/xelosani/friend/request/pending/get").get(get_pending_and_other_user_accepted_friend_requests)

// XELOSANI SERVICES
router.route("/xelosani/service").post(add_service).put(update_service)
router.route("/xelosani_service").post(get_xelosani_service)
router.route("/xelosani/get_services_profile_page").get(get_xelosani_services_profile_page)
// Map Management
router.route("/get_tiles").get(get_tiles)

// DAMKVETI

router.route("/damkveti/:profId").get(get_damkveti)

export default router