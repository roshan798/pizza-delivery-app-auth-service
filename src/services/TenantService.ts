import { Repository } from 'typeorm';
import { Tenant } from '../entity/Tenant';
import logger from '../config/logger';
export class TenantService {
	constructor(private readonly tenantRepo: Repository<Tenant>) {}
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

	async getTenantById(tenantID: string) {
		logger.info(`[SERVICE] getTenantByTenantID}`);
		return this.tenantRepo.findOne({
			where: {
				id: tenantID,
			},
		});
	}

	async updateTenantById(id: string, body: Partial<Tenant>) {
		logger.info(`[SERVICE] updateTenantById}`);
		return await this.tenantRepo.save(body);
	}

	async deleteTenantById(id: string) {
		logger.info(`[SERVICE] deleteTenantById}`);
		return await this.tenantRepo.delete({
			id,
		});
	}
}
