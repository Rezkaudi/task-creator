import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770900402240 implements MigrationInterface {
    name = 'Migrations1770900402240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "googleId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profilePicture" text`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_6f9a8d42f89668e50176c77c0c8"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_6f9a8d42f89668e50176c77c0c8" UNIQUE ("figmaUserId")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profilePicture"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_f382af58ab36057334fb262efd5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleId"`);
    }

}
