const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["farmer", "buyer", "supplier", "inspector", "logistics", "support", "admin"],
      default: "farmer",
    },
    roles: {
      type: [String],
      enum: ["farmer", "buyer", "supplier", "inspector", "logistics", "support", "admin"],
      default: function() {
        return [this.role || "farmer"];
      }
    },
    firebaseUid: {
      type: String,
      sparse: true
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayRole: {
      type: String,
      default: "",
    },
    region: {
      type: String,
      default: "",
    },
    nationalIdNumber: {
      type: String,
      default: "",
    },
    verificationBadge: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: ["Active", "Pending Verification", "Suspended"],
      default: "Active",
    },
    nationalId: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: String,
      default: "",
    },
    farmingExperienceYears: {
      type: Number,
      default: 0,
    },
    primaryLocation: {
      division: { type: String, default: "" },
      district: { type: String, default: "" },
      upazila: { type: String, default: "" },
      village: { type: String, default: "" },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      branchName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      routingNumber: { type: String, default: "" },
      mobileWalletNumber: { type: String, default: "" },
    },
    certifications: {
      type: [
        {
          _id: false,
          name: { type: String, default: "" },
          issuingAuthority: { type: String, default: "" },
          issuedYear: { type: Number, default: 0 },
          verified: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    farmerClub: {
      type: String,
      default: "",
    },
    totalAcreage: {
      type: Number,
      default: 0,
    },
    registeredSince: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
