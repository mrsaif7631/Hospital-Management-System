const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hospSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address.");
        }
      },
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
        type: Number,
        default: 0,
        enum: [0,1]
    },

    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error('Password cannot contain the word "password".');
        }
      },
    },

    status: {
      type: String,
      enum: ["Pending", "Active"],
      default: "Pending",
    },

    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],

    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);


// ===============================
// Virtual Relationship
// ===============================

hospSchema.virtual("myPat", {
  ref: "Patient",
  localField: "_id",
  foreignField: "owner",
});


// ===============================
// Login Method
// ===============================

hospSchema.statics.findByCredentials = async function (email, password) {
  const hosp = await this.findOne({ email });

  if (!hosp) {
    throw new Error("Unable to login.");
  }

  const isMatch = await bcrypt.compare(password, hosp.password);

  if (!isMatch) {
    throw new Error("Unable to login.");
  }

  return hosp;
};

hospSchema.statics.normalizeHospitalStatus = function ({ role, requestedStatus, isNew = false, explicitApproval = false }) {
  const normalizedRequestedStatus = requestedStatus === "Active" ? "Active" : "Pending";

  if (role === 1) {
    if (isNew) {
      return "Pending";
    }

    if (explicitApproval && normalizedRequestedStatus === "Active") {
      return "Active";
    }

    return "Pending";
  }

  if (isNew) {
    return "Pending";
  }

  return normalizedRequestedStatus;
};


// ===============================
// Generate JWT Token
// ===============================

hospSchema.methods.generateToken = async function () {
  const hosp = this;

  const token = jwt.sign(
    { _id: hosp._id.toString() },
    process.env.JWT_SECRET
  );

  hosp.tokens.push({ token });

  await hosp.save();

  return token;
};


// ===============================
// Hide Sensitive Data
// ===============================

hospSchema.methods.toJSON = function () {
  const hosp = this;
  const hospObject = hosp.toObject();

  delete hospObject.password;
  delete hospObject.tokens;
  delete hospObject.avatar;

  return hospObject;
};


// ===============================
// Hash Password Before Saving
// ===============================

hospSchema.pre("save", async function () {
  this.status = this.constructor.normalizeHospitalStatus({
    role: this.role,
    requestedStatus: this.status,
    isNew: this.isNew,
    explicitApproval: Boolean(this._explicitApproval),
  });

  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
});


// ===============================
// Create Model
// ===============================

const Hospital = mongoose.model("Hospital", hospSchema);

module.exports = Hospital;