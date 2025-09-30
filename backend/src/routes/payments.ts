import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();
const paymentController = new PaymentController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Payment CRUD operations
router.post('/', paymentController.createPayment);
router.get('/', paymentController.getPayments);
router.get('/recent', paymentController.getRecentPayments);
router.get('/:id', paymentController.getPaymentById);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

export default router;