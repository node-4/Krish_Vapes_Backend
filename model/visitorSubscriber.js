const mongoose = require('mongoose');
const schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');
const DocumentSchema = schema({
    email: {
        type: String
    },
    subscribeNow: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })
DocumentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("visitorSubscriber", DocumentSchema);