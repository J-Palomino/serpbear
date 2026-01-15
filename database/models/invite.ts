import { Table, Model, Column, DataType, PrimaryKey, Unique, ForeignKey, BelongsTo } from 'sequelize-typescript';
import crypto from 'crypto';
import User, { UserRole } from './user';

@Table({
   timestamps: true,
   tableName: 'invite',
})
class Invite extends Model {
   @PrimaryKey
   @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
   ID!: number;

   @Unique
   @Column({ type: DataType.STRING, allowNull: false, unique: true })
   token!: string;

   @Column({ type: DataType.STRING, allowNull: true })
   email!: string | null;

   @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'viewer' })
   role!: UserRole;

   @ForeignKey(() => User)
   @Column({ type: DataType.INTEGER, allowNull: false })
   createdBy!: number;

   @BelongsTo(() => User, 'createdBy')
   creator!: User;

   @Column({ type: DataType.DATE, allowNull: false })
   expiresAt!: Date;

   @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
   used!: boolean;

   @Column({ type: DataType.INTEGER, allowNull: true })
   usedBy!: number | null;

   @Column({ type: DataType.DATE, allowNull: true })
   usedAt!: Date | null;

   static generateToken(): string {
      return crypto.randomBytes(32).toString('hex');
   }

   isExpired(): boolean {
      return new Date() > this.expiresAt;
   }

   isValid(): boolean {
      return !this.used && !this.isExpired();
   }
}

export default Invite;
