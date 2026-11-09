const jwt = require("jsonwebtoken");
const User = require("../../database/models/User");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Helper to format user response with both role and roles
const formatUserResponse = (user, token) => {
  const roles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : [user.role || "farmer"];

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || roles[0],
      roles: roles,
      phone: user.phone || "",
      address: user.address || "",
      profileImage: user.profileImage || ""
    }
  };
};

exports.register = async (userData) => {
  const { name, email, password, role, phone, roles } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw httpError("User already exists", 409);
  }

  const userRoles = roles && roles.length > 0 ? roles : [role || "farmer"];

  const user = await User.create({
    name,
    email,
    password,
    role: role || "farmer",
    roles: userRoles,
    phone,
  });

  const token = generateToken(user._id);

  return formatUserResponse(user, token);
};

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw httpError("Invalid credentials", 401);
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw httpError("Invalid credentials", 401);
  }

  const token = generateToken(user._id);

  return formatUserResponse(user, token);
};

exports.getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw httpError("User not found", 404);
  }
  const token = generateToken(user._id);
  return formatUserResponse(user, token);
};

exports.socialAuth = async ({ firebaseUid, name, email, phone, role, avatarUrl }) => {
  let user = await User.findOne({ $or: [{ firebaseUid }, { email }] });

  if (!user) {
    const userRoles = role ? [role] : ["farmer"];
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      role: role || "farmer",
      roles: userRoles,
      phone: phone || "",
      profileImage: avatarUrl || "",
      firebaseUid,
      password: require("bcryptjs").hashSync(Math.random().toString(36).slice(-10) + "Aa1!", 10),
    });
  } else {
    // Update existing user with Firebase info if needed
    if (firebaseUid && !user.firebaseUid) {
      user.firebaseUid = firebaseUid;
    }
    if (avatarUrl && !user.profileImage) {
      user.profileImage = avatarUrl;
    }
    if (phone && !user.phone) {
      user.phone = phone;
    }
    await user.save();
  }

  const token = generateToken(user._id);
  return formatUserResponse(user, token);
};