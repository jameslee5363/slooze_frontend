import mongoose from 'mongoose';

mongoose.connect(process.env.DSN);

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    role: {type: String, enum: ['Manager', 'Store Keeper'], default: 'Store Keeper'}
});

const ProductSchema = new mongoose.Schema({
    name:  { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    category: String,
    inStock: { type: Boolean, default: true }
}, { timestamps: true });
  
mongoose.model('User', UserSchema);
mongoose.model('Product', ProductSchema);