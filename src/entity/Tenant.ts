import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tenants' })
export class Tenant {
	@PrimaryGeneratedColumn()
	id: string;

	@Column({ type: 'varchar', length: 100 })
	name: string;

	@Column({ type: 'varchar', length: 255 })
	address: string;

	@UpdateDateColumn()
	updatedAt: number;

	@CreateDateColumn()
	createdAt: number;
}
