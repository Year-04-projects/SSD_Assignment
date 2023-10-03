const router = require("express").Router();
const studentCtrl = require("../controllers/studentCtrl");
const auth = require("../middleware/auth");
const { validationResult } = require("express-validator");

  
router.post("/register", (req, res) => {
  //validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: "Error in registering" });
  }
  studentCtrl.register(req, res);
});

router.post("/activation", studentCtrl.activateEmail);


router.post("/login",studentCtrl.login);

router.post("/googleauth", studentCtrl.GoogleAuth);
router.post("/getuserwauth", studentCtrl.GetUserdatawauth);

router.post("/refreshtoken", studentCtrl.getAccessToken);

router.post("/forgot", studentCtrl.forgotPassword);

router.post("/reset", auth, studentCtrl.resetPassword);

router.get("/profile", auth, studentCtrl.getStudentInfor);

router.get("/allstudents", studentCtrl.getAllStudents);

router.get("/logout", studentCtrl.logout);

router.patch("/update", auth, studentCtrl.updateStudent);

router.delete("/delete/:id", auth, studentCtrl.deleteStudent);

module.exports = router;
