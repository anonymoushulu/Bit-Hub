import mongoose from 'mongoose';

const booksSchema = new mongoose.Schema({   
    exchange: String,
    market: String,
    price: Number,
    amount: Number,
    side: String
});

booksSchema.index({ exchange: 1, market: 1, price: 1, side: 1 }, {unique: true});
booksSchema.index({ price: 1 });
booksSchema.index({ price: -1 });

const books = mongoose.model('books',booksSchema);

module.exports = { books };