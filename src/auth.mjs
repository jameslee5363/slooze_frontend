import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const User = mongoose.model('User');

const startAuthenticatedSession = (req, user) => {
  return new Promise((fulfill, reject) => {
    req.session.regenerate((err) => {
      if (!err) {
        req.session.user = user; 
        fulfill(user);
      } else {
        reject(err);
      }
    });
  });
};

const endAuthenticatedSession = req => {
  return new Promise((fulfill, reject) => {
    req.session.destroy(err => err ? reject(err) : fulfill(null));
  });
};


const register = async (username, email, password, role = 'Store Keeper') => {
  if(username.length <= 8 || password.length <= 8) {
    throw { message: 'USERNAME PASSWORD TOO SHORT' };
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw { message: 'USERNAME ALREADY EXISTS' };
  }

  // salt and hash the password using bcrypt
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // create and save the new user
  const user = new User({
    username,
    email,
    password: hashedPassword,
    role
  });

  await user.save();
  return user;
};

const login = async (username, password) => {
  const existingUser = await User.findOne({ username });
  if (!existingUser) {
    throw { message: 'USER NOT FOUND' };
  }

  const isMatch = bcrypt.compareSync(password, existingUser.password);
  if (!isMatch) {
    throw { message: 'PASSWORDS DO NOT MATCH' };
  }

  return existingUser;
};

export  {
  startAuthenticatedSession,
  endAuthenticatedSession,
  register,
  login
};