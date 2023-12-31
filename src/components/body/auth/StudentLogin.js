import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import axios from "axios";
import {
  showErrorMsg,
  showSuccessMsg,
} from "../../utils/notification/notification";
import { dispatchLogin } from "../../../redux/actions/authAction";
import { useDispatch } from "react-redux";
import {GoogleLogin} from 'react-google-login';

import config from "../../../config";



const clientId=config.clientid

const initialState = {
  email: "",
  password: "",
  err: "",
  success: "",
};

function StudentLogin() {

  const googleAuth=async (res)=> {
    console.log("res",res)
    const googleToken = res.tokenId;
    localStorage.setItem('googleToken', googleToken);
    const response = await axios.post("/student/googleauth", { token:googleToken });
    
    console.log("responese",response.data.user)
    dispatch(dispatchLogin());
    history.push("/profile");

  }

  const [student, setStudent] = useState(initialState);
  const dispatch = useDispatch();
  const history = useHistory();

  const { email, password, err, success } = student;

  const handleChangeInput = (e) => {
    const { name, value } = e.target;
    setStudent({ ...student, [name]: value, err: "", success: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const res = await axios.post("/student/login", { email, password });
      setStudent({ ...student, err: "", success: res.data.msg });

      localStorage.setItem("firstLogin", true);
      dispatch(dispatchLogin());
      history.push("/profile");
    } catch (err) {
      err.response.data.msg &&
        setStudent({
          ...student,
          err: err.response.data.msg,
          success: "",
        });
    }
  };

  return (
    <div className="row d-flex align-items-center">
      <div className="col">
        <h2 className="h3 text-center subtitle">Student Login</h2>
        <p className="text-center desc-text">
          Login to class room using your student login details here.
        </p>
        <div className="loginForm">
          {err && showErrorMsg(err)}
          {success && showSuccessMsg(success)}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                className="form-control"
                name="email"
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={handleChangeInput}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Password</label>
              <input
                className="form-control"
                name="password"
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={handleChangeInput}
              />
            </div>
            <div className="form-group mt-1 d-flex align-items-center justify-content-between">
              <button type="submit" className="btn d-inline-block btn-success">
                Login
              </button>
            </div>
            <div class="form-group mt-1 d-flex align-items-center justify-content-center">
            <GoogleLogin
              clientId={clientId}
              buttonText="Google Login"
              onSuccess={googleAuth}
              onFailure={(e)=>console.log("faile",e)}
              cookiePolicy={'single_host_origin'}
              isSignedIn={false}
            />
            </div>
            <div className="form-group mt-3">
              <Link to="/forgotpassword" className="inline-link">
                Forgot password?
              </Link>
              <p>
                New student?
                <Link to="/studentregister" className="inline-link">
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
