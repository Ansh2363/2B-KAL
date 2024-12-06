var express = require('express');
var router = express.Router();
var Transaction = require('../models/Transaction');
const FuzzySearch = require('fuzzy-search');

// GET /TRANSACTIONS/SEARCH - SEARCH TRANSACTIONS
router.get('/search', async (req, res) => {
    const { query } = req.query;

    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }

    try {
        const userId = req.user._id;
        let transactions = [];

        if (query) {
            transactions = await Transaction.find({ user: userId }).exec();
            const searcher = new FuzzySearch(transactions, ['description', 'category'], {
                caseSensitive: false,
                sort: true
            });
            transactions = searcher.search(query);
        } else {
            transactions = await Transaction.find({ user: userId }).sort({ date: -1 });
        }

        const formattedTransactions = transactions.map(transaction => {
            return {
                _id: transaction._id.toString(),
                description: transaction.description,
                amount: transaction.amount,
                category: transaction.category,
                date: transaction.date.toLocaleDateString('en-US'),
            };
        });

        res.render('transactions/view', {
            description: 'Your Transactions',
            user: req.user.username,
            transactions: formattedTransactions,
            query,
        });
    } catch (err) {
        console.log(err);
        res.status(500).render('index', {
            description: 'Your Transactions',
            user: req.user.username,
            error: 'Could not load your transactions. Please try again later.',
        });
    }
});

// GET /TRANSACTIONS/VIEW - VIEW TRANSACTIONS
router.get('/view', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }

    try {
        const userId = req.user._id;
        const transactions = await Transaction.find({ user: userId }).sort({ date: -1 });

        const formattedTransactions = transactions.map(transaction => {
            return {
                _id: transaction._id.toString(),
                description: transaction.description,
                amount: transaction.amount,
                category: transaction.category,
                date: transaction.date.toLocaleDateString('en-US'),
            };
        });

        res.render('transactions/view', {
            title: 'Your Transactions',
            user: req.user.username,
            transactions: formattedTransactions,
        });
    } catch (err) {
        console.log(err);
        res.status(500).render('index', {
            title: 'Your Transactions',
            user: req.user.username,
            error: 'Could not load your transactions. Please try again later.',
        });
    }
});

// GET ROUTE TO DISPLAY THE "ADD TRANSACTION" FORM
router.get('/add', (req, res) => {
    if (!req.user) {
        return res.redirect('/users/login');
    }
    res.render('transactions/add', { title: 'Add Transaction' });
});

// POST ROUTE TO HANDLE THE SUBMISSION OF THE "ADD TRANSACTION" FORM
router.post('/add', async (req, res) => {
    const { description, amount, category, date } = req.body;

    if (!description || !amount || !category || !date) {
        return res.render('transactions/add', {
            title: 'Add Transaction',
            error: 'All fields are required!',
        });
    }

    try {
        const newTransaction = new Transaction({
            user: req.user._id,
            description,
            amount,
            category,
            date,
        });

        await newTransaction.save();
        res.redirect('/transactions/view');
    } catch (err) {
        console.error(err);
        res.render('transactions/add', {
            title: 'Add Transaction',
            error: 'Error saving transaction!',
        });
    }
});

// GET /TRANSACTIONS/:ID/EDIT - EDIT TRANSACTION
router.get('/:id/edit', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }

    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).render('index', {
                title: 'Edit Transaction',
                user: req.user.username,
                error: 'Transaction not found.',
            });
        }

        if (transaction.user.toString() !== req.user._id.toString()) {
            return res.status(403).render('index', {
                title: 'Edit Transaction',
                user: req.user.username,
                error: 'You are not authorized to edit this transaction.',
            });
        }

        const formattedDate = new Date(transaction.date).toISOString().split('T')[0];
        const transactionObject = transaction.toObject();
        transactionObject.formattedDate = formattedDate;

        res.render('transactions/edit', {
            title: 'Edit Transaction',
            transaction: transactionObject,
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('index', {
            title: 'Edit Transaction',
            user: req.user.username,
            error: 'Error fetching transaction data.',
        });
    }
});

// POST /TRANSACTIONS/:ID/EDIT - UPDATE TRANSACTION
router.post('/:id/edit', async (req, res) => {
    const { description, amount, category, date } = req.body;

    if (!description || !amount || !category || !date) {
        return res.render('transactions/edit', {
            title: 'Edit Transaction',
            error: 'All fields are required!',
            transaction: req.body,
        });
    }

    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).render('index', {
                title: 'Edit Transaction',
                user: req.user.username,
                error: 'Transaction not found.',
            });
        }

        if (transaction.user.toString() !== req.user._id.toString()) {
            return res.status(403).render('index', {
                title: 'Edit Transaction',
                user: req.user.username,
                error: 'You are not authorized to edit this transaction.',
            });
        }

        transaction.description = description;
        transaction.amount = amount;
        transaction.category = category;
        transaction.date = new Date(date);

        await transaction.save();
        res.redirect('/transactions/view');
    } catch (err) {
        console.error(err);
        res.status(500).render('index', {
            title: 'Edit Transaction',
            user: req.user.username,
            error: 'Error updating transaction!',
        });
    }
});

// POST /TRANSACTIONS/:ID/DELETE - DELETE TRANSACTION
router.post('/:id/delete', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }

    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).render('index', {
                title: 'Delete Transaction',
                user: req.user.username,
                error: 'Transaction not found.',
            });
        }

        if (transaction.user.toString() !== req.user._id.toString()) {
            return res.status(403).render('index', {
                title: 'Delete Transaction',
                user: req.user.username,
                error: 'You are not authorized to delete this transaction.',
            });
        }

        await Transaction.findByIdAndDelete(req.params.id);
        res.redirect('/transactions/view');
    } catch (err) {
        console.error(err);
        res.status(500).render('index', {
            title: 'Delete Transaction',
            user: req.user.username,
            error: 'Error deleting transaction!',
        });
    }
});

// Export the router
module.exports = router;
