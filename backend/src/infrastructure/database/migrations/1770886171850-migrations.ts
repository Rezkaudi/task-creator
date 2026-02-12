import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770886171850 implements MigrationInterface {
    name = 'Migrations1770886171850'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_6f9a8d42f89668e50176c77c0c8"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_6f9a8d42f89668e50176c77c0c8" UNIQUE ("figmaUserId")`);
    }

}
