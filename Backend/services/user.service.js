import userModel from "../models/user.model.js";

export const createUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("emial and password required ");
  }

  const hashedpass = await userModel.Hashpassword(password);
  const user = await userModel.create({
    email,
    password: hashedpass,
  });
  return user;
};

export const getallusers = async ({ userID }) => {
  const users = await userModel.find({ _id: { $ne: userID } });
  console.log("Service - Fetched users:", users);
  return users;
};
