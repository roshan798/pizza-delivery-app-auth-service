import { Repository } from 'typeorm';
import { Tenant } from '../entity/Tenant';
import logger from '../config/logger';
export class TenantService {
	constructor(private tenantRepo: Repository<Tenant>) {}
	async createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
		logger.info(
			`[SERVICE] Creating tenant with data: ${JSON.stringify(tenantData)}`
		);
		return await this.tenantRepo.save(tenantData);
	}

	async getTenants() {
		logger.info(`[SERVICE] getTenants}`);
		return this.tenantRepo.find();
	}
}
