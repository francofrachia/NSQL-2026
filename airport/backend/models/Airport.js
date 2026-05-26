const mongoose = require("mongoose");

const airportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, default: "" },
    iata_code: { type: String, default: null, index: true },
    icao: { type: String, default: null, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    alt: { type: Number, default: 0 },
    tz: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Airport", airportSchema);
