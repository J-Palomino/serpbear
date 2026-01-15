import { Table, Model, Column, DataType, PrimaryKey, Unique, BeforeCreate, BeforeUpdate } from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export type UserRole = 'admin' | 'editor' | 'viewer';

@Table({
   timestamps: true,
   tableName: 'user',
})
class User extends Model {
   @PrimaryKey
   @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
   ID!: number;

   @Unique
   @Column({ type: DataType.STRING, allowNull: false, unique: true })
   email!: string;

   @Unique
   @Column({ type: DataType.STRING, allowNull: false, unique: true })
   username!: string;

   @Column({ type: DataType.STRING, allowNull: false })
   password!: string;

   @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'viewer' })
   role!: UserRole;

   @Unique
   @Column({ type: DataType.STRING, allowNull: true, unique: true })
   apiKey!: string | null;

   @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
   isActive!: boolean;

   @Column({ type: DataType.DATE, allowNull: true })
   lastLogin!: Date | null;

   @BeforeCreate
   @BeforeUpdate
   static async hashPassword(instance: User) {
      if (instance.changed('password')) {
         const salt = await bcrypt.genSalt(10);
         instance.password = await bcrypt.hash(instance.password, salt);
      }
   }

   async validatePassword(password: string): Promise<boolean> {
      return bcrypt.compare(password, this.password);
   }

   static generateApiKey(): string {
      return crypto.randomBytes(32).toString('hex');
   }
}

export default User;
