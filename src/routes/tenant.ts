import express, { Request, Response, NextFunction } from 'express';
import { TenantController } from '../controllers/TenantController';
import { TenantService } from '../services/TenantService';
import { Tenant } from '../entity/Tenant';
import { AppDataSource } from '../config/data-source';
import {
	createTenantValidator,
	idParamValidator,
	updateTenantValidator,
} from '../validators/tenant-create-validators';
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
	createTenantValidator,
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

router.get(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN]),
	idParamValidator,
	async (req: Request, res: Response, next: NextFunction) => {
		await tenantController.getTenantById(req, res, next);
	}
);

router.put(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN]),
	idParamValidator,
	updateTenantValidator,
	async (req: Request, res: Response, next: NextFunction) => {
		await tenantController.updateTenantById(req, res, next);
	}
);

router.delete(
	'/:id',
	authenticate,
	canAccess([Roles.ADMIN]),
	idParamValidator,
	async (req: Request, res: Response, next: NextFunction) => {
		await tenantController.deleteTenantById(req, res, next);
	}
);

export default router;
