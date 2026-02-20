import mongoose from 'mongoose';

const speciesSchema = new mongoose.Schema({

    id :{
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    scientificName: {
        type: String,
        required: true,
        unique: true
    },

    // --- IDENTIFICATION STAGES ---
    bodyShape: {
        type: String,
        enum: ["oval", "torpedo", "flat", "eel-like", "box-like"],
        required: true
    },
    tailShape: {
        type: String,
        enum: ["forked", "square", "crescent", "pointed", "rounded"],
        required: true
    },
    finType: {
        type: String,
        enum: ["spiny", "soft-ray", "large-dorsal", "no-dorsal"],
        required: true
    },
    colorPattern: {
        type: String,
        enum: ["blue-silver", "brown", "white-striped", "spotted", "plain"],
        required: true
    },

    // --- LEGAL STATUS ---
    protectionStatus: {
        type: String,
        enum: ["Protected", "Endangered", "Critically Endangered", "Banned", "Legal"],
        required: true
    },
    isFullyBanned: {
        type: Boolean,
        default: false
    },
    legalMinSizeCm: {
        type: Number,
        required: false
    },
    legalSeason: {
        startMonth: { type: Number, min: 1, max: 12 },
        endMonth:   { type: Number, min: 1, max: 12 }
    },
    regions: {
        type: [String],
        required: true
    },

    // --- MEDIA ---
    image: {
        type: String,
        default: []
    },
    description: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model("Species", speciesSchema);