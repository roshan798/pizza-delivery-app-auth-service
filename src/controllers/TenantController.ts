import { Response, NextFunction, Request } from 'express';
import { TenantService } from '../services/TenantService';
import logger from '../config/logger';
import { validationResult } from 'express-validator';
import { TenantCreateRequest } from '../types';
import { Config } from '../config';
import createHttpError from 'http-errors';
export class TenantController {
	constructor(private tenantService: TenantService) {}
	async createTenant(
		req: TenantCreateRequest,
		res: Response,
		next: NextFunction
	) {
		logger.info('[CREATE] Request received');
		const validationErrors = validationResult(req);
		if (!validationErrors.isEmpty()) {
			logger.warn('[CREATE] Input validation failed');
			logger.debug(
				`[CREATE] validation errors: ${JSON.stringify(validationErrors.array())}`
			);
			return res.status(400).json({
				success: false,
				message: 'Invalid input data',
				errors: validationErrors.array(),
			});
		}
		const tenantData = req.body;
		logger.info(
			`[CREATE] Creating tenant with data: ${JSON.stringify(tenantData)}`
		);
		try {
			const savedTenant =
				await this.tenantService.createTenant(tenantData);
			res.status(201).json({ id: savedTenant.id });
		} catch (err) {
			logger.error('[CREATE] Internal server error');
			if (Config.NODE_ENV !== 'production') logger.debug(err);
			next(
				createHttpError(500, 'An error occurred during tenant creation')
			);
		}
	}

	async getTenants(req: Request, res: Response, next: NextFunction) {
		logger.info('[GET] Request received');
		try {
			const tenants = await this.tenantService.getTenants();
			res.json({
				success: true,
				tenants: tenants,
			});
		} catch (error) {
			next(error);
		}
	}

	async getTenantById(req: Request, res: Response, next: NextFunction) {
		logger.info('[GET] By Tenant ID  Request received');
		try {
			const id: string = req.params.id;
			const numericId = Number(id);
			if (!id || id.trim() === '' || isNaN(numericId)) {
				return res.status(400).json({
					success: false,
					message: 'Invalid tenant ID!',
				});
			}
			const tenant = await this.tenantService.getTenantById(id);
			if (!tenant) {
				return res.status(404).json({
					success: false,
					message: 'Tenant not found',
				});
			}
			res.json({
				success: true,
				tenant: tenant,
			});
		} catch (error) {
			next(error);
		}
	}
}
