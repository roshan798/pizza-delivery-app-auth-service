import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTable1752300402283 implements MigrationInterface {
	name = 'RenameTable1752300402283';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// await queryRunner.query(`ALTER TABLE "refreshToken" RENAME TO "refreshTokens"`);
		await queryRunner.renameTable('refresh_token', 'refreshTokens');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.renameTable('refreshTokens', 'refresh_token');
		// await queryRunner.query(`ALTER TABLE "refreshTokens" RENAME TO "refreshToken"`);
	}
}
