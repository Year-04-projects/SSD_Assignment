import React, { useState, useEffect } from "react";
import axios from "axios";
import ACTIONS from "../../../redux/actions";
import { useSelector, useDispatch } from "react-redux";
import { Link, useHistory } from "react-router-dom";
import { isLength, isMatch } from "../../utils/validation/Validation";
import { dispatchDelete } from "../../../redux/actions/authAction";
import {
  showSuccessMsg,
  showErrorMsg,
} from "../../utils/notification/notification";
import DOMPurify from 'dompurify';

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  phone: "",
  password: "",
  password2: "",
  gender: "",
  err: "",
  success: "", 
};

function StudentProfile() {
  const auth = useSelector((state) => state.auth);
  const token = useSelector((state) => state.token);
  const { student, isLogged } = auth;
  console.log("fdfdsf",student)
  const history = useHistory();
  const [data, setData] = useState(initialState);
  const [thumbnail, setThumbnail] = useState(false);

  const [studentdata, setStudentdata] = useState([]);

  const loaddata = async (e) => {
    if (student.length===0) {
      
      const googleToken = localStorage.getItem("googleToken");
      const response = await axios.post("/student/getuserwauth", { token:googleToken });
      console.log("respone",response.data.user)
      setStudentdata(response.data.user)

    }
  }
  useEffect(() => {
    loaddata();
  }, [student]);
  const {
    firstName,
    lastName,
    email,
    address,
    phone,
    password,
    password2,
    gender,
    err,
    success,
  } = data;
  const [loading, setLoading] = useState(false);
  const [callback, setCallback] = useState(false);

  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value, err: "", success: "" });
  };

  const changeThumbnail = async (e) => {
    e.preventDefault();
    try {
      const file = e.target.files[0];
      if (!file)
        return setData({ ...data, err: "No files were uploaded", success: "" });

      if (file.size > 1024 * 1024) {
        return setData({ ...data, err: "Size too large", success: "" });
      } // 1mb

      if (file.type !== "image/jpeg" && file.type !== "image/png") {
        return setData({
          ...data,
          err: "File format not supported",
          success: "",
        });
      } // 1mb

      let formData = new FormData();
      formData.append("file", file);

      setLoading(true);

      const res = await axios.post("/api/uploadthumbnail", formData, {
        headers: {
          "content-type": "multipart/form-data",
          Authorization: token,
        },
      });

      setLoading(false);
      setThumbnail(res.data.url);
    } catch (err) {
      setData({ ...data, err: err.response.data.msg, success: "" });
    }
  };

  const updateProfile = () => {
    try {
      axios.patch(
        "/student/update",
        {
          firstName: firstName ? firstName : studentdata.firstName,
          lastName: lastName ? lastName : studentdata.lastName,
          address: address ? address : studentdata.address,
          phone: phone ? phone : studentdata.phone,
          thumbnail: thumbnail ? thumbnail : studentdata.thumbnail,
        },
        {
          headers: { Authorization: token },
        }
      );
      setData({ ...data, err: "", success: "Updated Successfully" });
    } catch (err) {
      setData({ ...data, err: err.response.data.msg, success: "" });
    }
  };

  const updatePassword = () => {
    if (isLength(password))
      return setData({
        ...data,
        err: "Password must be at least 6 characters",
        success: "",
      });

    if (!isMatch(password, password2))
      return setData({
        ...data,
        err: "Passwords do not match",
        success: "",
      });
    try {
      axios.post(
        "/student/reset",
        { password },
        {
          headers: { Authorization: token },
        }
      );
      setData({ ...data, err: "", success: "Updated Successfully" });
    } catch (err) {
      setData({ ...data, err: err.response.data.msg, success: "" });
    }
  };

  const handleUpdate = () => {
    if (firstName || lastName || address || phone || thumbnail) updateProfile();
    if (password) updatePassword();
  };

  const handleDelete = () => {
    try {
      if (
        window.confirm(
          "Are you sure you want to delete your account? This action is irreversible."
        )
      ) {
        axios.delete(`student/delete/${studentdata._id}`, {
          headers: { Authorization: token },
        });
        dispatch(dispatchDelete(studentdata.id));
        localStorage.removeItem("firstLogin");
        history.push("/studentregister");
      }
    } catch (err) {
      setData({ ...data, err: err.response.data.msg, success: "" });
    }
  };

  const sanitizedThumbnail = DOMPurify.sanitize(thumbnail ? thumbnail : student.thumbnail);
  return (
    <>
      <div className="row">
        <div className="notification-bar">
          {err && showErrorMsg(err)}
          {success && showSuccessMsg(success)}
          {loading && <span>Loading...</span>}
        </div>
      </div>

      <div className="row">
        <div className="col" id="studentWidget">
          <h2 className="h4 text-center subtitle">Student Profile</h2>
          <div className="studentThumbnail">
            <img
              src={sanitizedThumbnail}
              alt=""
              className="img-fluid"
            />
            <span>
              <i class="fas fa-camera"></i>
              <p>Change</p>
              <input
                type="file"
                name="file"
                id="file_up"
                onChange={changeThumbnail}
              />
            </span>
          </div>
          <div className="profile-form">
            <div className="row">
              <div className="form-group col">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control form-control-sm"
                  placeholder="First Name"
                  defaultValue={student.firstName ??studentdata.firstName}
                  id="firstName"
                  onChange={handleChange}
                />
              </div>
              <div className="form-group col">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control form-control-sm"
                  placeholder="Last Name"
                  defaultValue={student.lastName??studentdata.lastName}
                  id="lastName"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control form-control-sm"
                  placeholder="Email"
                  defaultValue={student.email??studentdata.email}
                  id="email"
                  disabled
                />
              </div>
            </div>
            <div className="row">
              <div className="col form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-control form-control-sm"
                  placeholder="Address"
                  defaultValue={student.address??studentdata.address}
                  id="address"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control form-control-sm"
                  placeholder="Phone"
                  defaultValue={student.phone??studentdata.phone}
                  id="phone"
                  onChange={handleChange}
                />
              </div>
              <div className="col form-group">
                <label htmlFor="gender">Gender</label>
                <input
                  type="text"
                  name="gender"
                  className="form-control form-control-sm"
                  placeholder="Gender"
                  defaultValue={student.gender??studentdata.gender}
                  id="gender"
                  disabled
                />
              </div>
            </div>
            <div className="row">
              <div className="col form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-control form-control-sm"
                  placeholder="Password"
                  id="password"
                  value={password}
                  onChange={handleChange}
                />
              </div>
              <div className="col form-group">
                <label htmlFor="password2">Retype password</label>
                <input
                  type="password"
                  name="password2"
                  className="form-control form-control-sm"
                  placeholder="Retype password"
                  id="password2"
                  value={password2}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col form-group d-grid">
                <button
                  onClick={handleUpdate}
                  className="btn btn-success mt-2"
                  disabled={loading}
                >
                  Update info
                </button>
                <button onClick={handleDelete} className="btn btn-danger mt-2">
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col" id="dashboardContent"></div>
      </div>
    </>
  );
}

export default StudentProfile;
