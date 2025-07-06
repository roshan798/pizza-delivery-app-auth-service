import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity()
export class RefreshToken {
	@PrimaryGeneratedColumn()
	id: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	user: User;

	@Column({ type: 'timestamp' })
	expiresAt: Date;

	@UpdateDateColumn()
	updatedAt: number;

	@CreateDateColumn()
	createdAt: number;
}
