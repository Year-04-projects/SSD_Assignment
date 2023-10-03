const Students = require("../models/studentModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendMail = require("./sendMail");
const { OAuth2Client } = require("google-auth-library");
const logger = require("../logger/logger");
const DOMPurify = require("dompurify");

const { CLIENT_URL } = process.env;

//input santaization logic
function sanitizeInputs(input) {
  const rmvHtml = input.replace(/<[^>]*>/g, "");
  const safeChrts = rmvHtml.replace(/[&<>"'`=\/]/g, "");
  const trimmedInput = safeChrts.trim();
  const finalInput = trimmedInput;

  return finalInput;
}

const studentCtrl = {
  register: async (req, res) => {
    // console.log(req.body);
    logger.info("Student Registration request received");
    try {
      var {
        firstName,
        lastName,
        email,
        nic,
        address,
        phone,
        gender,
        password,
      } = DOMPurify.sanitize(req.body);;

      if (
        !firstName ||
        !lastName ||
        !email ||
        !nic ||
        !address ||
        !phone ||
        !gender ||
        !password
      )
        return res.status(400).json({ msg: "Please fill in all fields" });

      firstName = sanitizeInputs(firstName);
      lastName = sanitizeInputs(lastName);
      email = sanitizeInputs(email);
      nic = sanitizeInputs(nic);
      address = sanitizeInputs(address);
      phone = sanitizeInputs(phone);
      gender = sanitizeInputs(gender);

      if (!validateEmail(email))
        return res.status(400).json({ msg: "Invalid email" });

      const student = await Students.findOne({ email });
      if (student)
        return res.status(400).json({ msg: "This email already exists" });

      if (password.length < 6)
        return res
          .status(400)
          .json({ msg: "Password must be at least 6 characters" });

      const passwordHash = await bcrypt.hash(password, 12);
      const newStudent = new Students({
        firstName,
        lastName,
        email,
        nic,
        address,
        phone,
        gender,
        password: passwordHash,
      });
      await newStudent.save();

      res.json({
        msg: "Register success! ",
      });
    } catch (err) {
      logger.err("Error in Registration", err.message);
      return res.status(500).json({ msg: "error in registering" });
    }
  },
  activateEmail: async (req, res) => {
    try {
      const { activation_token } = req.body;
      const student = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET
      );
      const {
        firstName,
        lastName,
        email,
        nic,
        address,
        phone,
        gender,
        password,
      } = student;

      const check = await Students.findOne({ email });

      if (check)
        return res.status(400).json({ msg: "This email already exists" });

      const newStudent = new Students({
        firstName,
        lastName,
        email,
        nic,
        address,
        phone,
        gender,
        password,
      });

      await newStudent.save();

      res.json({ msg: "Account has been activated! Now you can login" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  GetUserdatawauth: async (req, res) => {
    const clientId = process.env.CLIENT_ID;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "No Token Provided" });
    }
    const client = new OAuth2Client(clientId);
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      const student = await Students.findOne({ email: payload.email });
      return res.status(200).json({ message: "DATA FOUND", user: student });
    } catch (error) {
      return res.status(200).json({ message: "Data Not Found" });
    }
  },
  GoogleAuth: async (req, res) => {
    const clientId = process.env.CLIENT_ID;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "No Token Provided" });
    }
    const client = new OAuth2Client(clientId);

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      const student = await Students.findOne({ email: payload.email });
      if (!student) {
        const newStudent = new Students({
          firstName: payload.given_name,
          lastName: payload.family_name,
          email: payload.email,
          nic: "null",
          address: "null",
          phone: "null",
          gender: "null",
          thumbnail: payload.picture,
        });
        await newStudent.save();
      }
      const studentnew = await Students.findOne({ email: payload.email });

      const refresh_token = createRefreshToken({ id: studentnew._id });
      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/student/refreshtoken",
        secure :true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7days
      });
      return res
        .status(200)
        .json({ message: "Token is valid Login success", user: studentnew });
    } catch (error) {
      // console.log("error",error)
      return res.status(401).json({ error: "Token is invalid" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      

      const student = await Students.findOne({ email });
      if (!student)
        return res.status(400).json({ msg: "This email does not exist" });

      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch)
        return res.status(400).json({ msg: "The password is incorrect" });

      const refresh_token = createRefreshToken({ id: student._id });
      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        secure: true,
        path: "/student/refreshtoken",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7days
      });

      if (req.timedout) {
        return;
      }
      res.json({ msg: "Login success!" });
    } catch (err) {
      if (req.timedout) {
        return;
      }
      return res.status(500).json({ msg: err.message });
    }
  },
  getAccessToken: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token) return res.status(400).json({ msg: "Please login now!" });

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, student) => {
        if (err) return res.status(400).json({ msg: "Please login now!" });

        const access_token = createAccessToken({ id: student.id });
        res.json({ access_token });
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = DOMPurify.sanitize(req.body);;
      const student = await Students.findOne({ email });
      if (!student)
        return res.status(400).json({ msg: "This email does not exist" });

      const access_token = createAccessToken({ id: student.id });
      const url = `${CLIENT_URL}/student/reset/${access_token}`;

      sendMail(email, url, "Reset your password");
      res.json({ msg: "Resent the password, please check your email" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { password } = req.body;
      const passwordHash = await bcrypt.hash(password, 12);

      await Students.findOneAndUpdate(
        { _id: req.student.id },
        {
          password: passwordHash,
        }
      );
      res.json({ msg: "Password successfully updated! Now you can login" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getStudentInfor: async (req, res) => {
    try {
      const student = await Students.findById(req.student.id).select(
        "-password"
      );
      res.json(student);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/student/refreshtoken" });
      return res.json({ msg: "Logged Out" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updateStudent: async (req, res) => {
    try {
      const { firstName, lastName, nic, address, phone, dob, thumbnail } =
        req.body;
      await Students.findOneAndUpdate(
        { _id: req.student.id },
        {
          firstName,
          lastName,
          nic,
          address,
          phone,
          phone,
          dob,
          thumbnail,
        }
      );

      res.json({ msg: "Student details update successful!" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getAllStudents: async (req, res) => {
    try {
      const students = await Students.find().select("-password");
      res.json(students);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteStudent: async (req, res) => {
    try {
      await Students.findByIdAndDelete(req.student.id);
      res.json({ msg: "Delete success!" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const createActivationToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: "5m",
  });
};
const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};
const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = studentCtrl;
