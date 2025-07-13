import { Repository } from 'typeorm';
import { Tenant } from '../entity/Tenant';
import logger from '../config/logger';
export class TenantService {
	constructor(private tenantRepo: Repository<Tenant>) {}
	async createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
		logger.info(
			`[SERVICE] Creating tenant with data: ${JSON.stringify(tenantData)}`
		);
		// {"level":"debug","message":"No metadata for \"Tenant\" was found.","service":"auth-service","timestamp":"2025-07-12T18:55:53.958Z"}

		return await this.tenantRepo.save(tenantData);
	}
}
