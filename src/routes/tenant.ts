import express, { Request, Response, NextFunction } from 'express';
import { TenantController } from '../controllers/TenantController';
import { TenantService } from '../services/TenantService';
import { Tenant } from '../entity/Tenant';
import { AppDataSource } from '../config/data-source';
import tenantCreateValidators from '../validators/tenant-create-validators';
import authenticate from '../middlewares/authenticate';
import canAccess from '../middlewares/canAccess';
import { Roles } from '../constants';

const router = express.Router();

const tenantRepo = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepo);
const tenantController = new TenantController(tenantService);

router.post(
	'/',
	authenticate,
	canAccess([Roles.ADMIN]),
	tenantCreateValidators,
	async (req: Request, res: Response, next: NextFunction) => {
		await tenantController.createTenant(req, res, next);
	}
);

router.get(
	'/',
	authenticate,
	canAccess([Roles.ADMIN]),
	async (req: Request, res: Response, next: NextFunction) => {
		await tenantController.getTenants(req, res, next);
	}
);

export default router;
