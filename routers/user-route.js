import express from "express"
import { register, login, change_user_password } from "../controllers/authentication.js"
import { find_user_by_phone_email, get_email_by_profId } from "../controllers/xelosani/search/find.js"
import { get_account } from "../controllers/account/get_account.js"
import { get_targeted_notification_devices, update_notification_devices } from "../controllers/account/notification_devices.js"
import { get_xelosani_privacy, update_xelosani_privacy } from "../controllers/account/privacy.js"
import { 
    get_xelosani_step_data, 
    get_xelosani,
    insert_xelosani_skills,
    insert_xelosani_schedule, 
    check_xelosani_skills, 
    get_xelosani_not_authorized,
    check_xelosani_schedule,
    modify_xelosani_schedule,
    modify_xelosani_skills,
    mark_user_as_setup_done,
    get_user_step_percent,
    handle_user_about,
    check_user_about,
    check_user_contact,
    update_user_email,
    update_user_phone,
    update_user_age,
    check_user_age,
    check_user_gender,
    update_user_gender,
    modify_user_age,
    modify_user_about,
    increment_user_step_percent,
}
from "../controllers/xelosani/get_xelosani.js"
import { get_tiles } from "../controllers/location/tiles.js"
import { check_user_location, create_user_location } from "../controllers/location/user.js"
import { get_damkveti } from "../controllers/damkveti/damkveti-controller.js"
import { add_service, update_service, get_xelosani_service, get_xelosani_services_profile_page, get_all_user_service } from "../controllers/xelosani/service/service.js"
import { send_user_friend_request, cancel_friend_request, check_for_unseen_notifications, get_notifications, accept_friend_request, mark_notification_as_read, remove_notification, get_friends_home, mark_all_notification_as_read, mark_specials_as_read, mark_users_as_read, get_friend_requests, get_all_friends, get_sent_requests, get_mutual_friends } from "../controllers/friends.js"
import { get_all_xelosani_skills } from "../controllers/xelosani/skills.js"
import { get_all_notifications, get_all_special_notifications, get_all_unread_special_notifications, get_all_unread_users_notifications, get_all_users_notifications } from "../controllers/xelosani/notifications/notifications.js"
import { get_browse_initial_services } from "../controllers/browse/services.js"
import { get_conversations, get_messages, start_conversation } from "../controllers/conversations/main.js"

const router = express.Router()

/*
    JUST REALIZED THAT SENDING "user_id" is better for security than sending profids omg fkk
*/

// Authentication Management
router.route("/register").post(register)
router.route("/login").post(login)
router.route("/user/find_by_phone_email").post(find_user_by_phone_email)
router.route("/user/find_email_by_profId/:profId").get(get_email_by_profId)
router.route("/user/password/:profId").put(change_user_password)

// Account Management
router.route("/account").post(get_account)
router.route("/notification_targets").post(get_targeted_notification_devices).put(update_notification_devices)
router.route("/privacy").post(get_xelosani_privacy).put(update_xelosani_privacy)

// Get user
router.route("/xelosani/:profId").get(get_xelosani)

// User setup
router.route("/:role/about/:profId").get(check_user_about).put(handle_user_about)
router.route("/:role/step_percent/:profId").get(get_user_step_percent)
router.route("/:role/get_step_data/:userId").get(get_xelosani_step_data)
router.route("/:role/check_contact/:profId").get(check_user_contact)
router.route("/:role/update_email/:id").put(update_user_email)
router.route("/:role/update_phone/:id").put(update_user_phone)
router.route("/:role/update_date/:profId").put(update_user_age)
router.route("/:role/check_date/:profId").get(check_user_age)
router.route("/:role/check_gender/:profId").get(check_user_gender)
router.route("/:role/update_gender/:profId").put(update_user_gender)
router.route("/:role/check_location/:userId").get(check_user_location)
router.route("/:role/modify_age/:profId").put(modify_user_age)
router.route("/:role/modify_about").put(modify_user_about)
router.route("/:role/increment_step_percent/:profId").get(increment_user_step_percent)
router.route("/:role/setup_done/:profId").get(mark_user_as_setup_done)
router.route("/:role/not_authorized/:profId").get(get_xelosani_not_authorized)
router.route("/:role/handle_location/:userId").post(create_user_location)

// ----------- Xelosani setup specific ------------ //
router.route("/xelosani/check_skills/:userId").get(check_xelosani_skills)
router.route("/xelosani/insert_skills").post(insert_xelosani_skills)
router.route("/xelosani/check_schedule/:userId").get(check_xelosani_schedule)
router.route("/xelosani/insert_schedule").post(insert_xelosani_schedule)
router.route("/xelosani/modify_xelosani_schedule").put(modify_xelosani_schedule)
router.route("/xelosani/modify_xelosani_skills").put(modify_xelosani_skills)

// FRIENDS

router.route("/friend/status/:status").post(cancel_friend_request)
router.route("/:role/friend/send/:targetId").get(send_user_friend_request)
router.route("/accept/friend").post(accept_friend_request)
router.route("/friends/get_friends_home").post(get_friends_home)
router.route("/friends/get_mutual_friends").post(get_mutual_friends)
router.route("/friends/get_friend_requests").get(get_friend_requests)
router.route("/friends/get_all_friends").get(get_all_friends)
router.route("/friends/get_sent_requests").post(get_sent_requests)

// Notifications
router.route("/notifications/get/:notif_type").get(get_notifications)
router.route("/notifications/unseen").get(check_for_unseen_notifications)
router.route("/notification/mark_as_read").put(mark_notification_as_read)
router.route("/notification/remove").post(remove_notification)
router.route("/notification/mark_all_as_read").get(mark_all_notification_as_read)

// ------- SERVICES -------- //

// -- UPLOAD

router.route("/xelosani/service").post(add_service).put(update_service)
router.route("/xelosani/get_services_profile_page").get(get_xelosani_services_profile_page)

// -- RETREIVE

router.route("/get_browse_initial_services").get(get_browse_initial_services)
router.route("/xelosani_service/:service_public_id").get(get_xelosani_service)
router.route("/xelosani/services/get/all").get(get_all_user_service)

// -------------- //

// Skills

router.get("/get_all_xelosani_skills/:id", get_all_xelosani_skills)

// Notifications

router.get("/notifications/get_specials", get_all_special_notifications)
router.get("/notifications/get_unread_specials", get_all_unread_special_notifications)
router.get("/notifications/get_users", get_all_users_notifications)
router.get("/notifications/get_unread_users", get_all_unread_users_notifications)
router.get("/notifications/mark_specials_as_read", mark_specials_as_read)
router.get("/notifications/mark_users_as_read", mark_users_as_read)
router.get("/notifications/get_unread_users/:userId", get_all_notifications)

// Map Management
router.route("/get_tiles").get(get_tiles)

// Conversations
router.route("/coversation/start").post(start_conversation)
router.route("/conversations/:userId").get(get_conversations)
router.route("/messages/:conversation_id/:userId").get(get_messages)

// DAMKVETI

router.route("/damkveti/:profId").get(get_damkveti)

export default router