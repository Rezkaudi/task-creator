import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1772459965287 implements MigrationInterface {
    name = 'Migrations1772459965287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_9a93dcdcaca440fc60c7bbd283"`);
        await queryRunner.query(`ALTER TABLE "client_errors" DROP COLUMN "errorCode"`);
        await queryRunner.query(`ALTER TABLE "client_errors" DROP COLUMN "errorStack"`);
        await queryRunner.query(`ALTER TABLE "client_errors" DROP COLUMN "pluginVersion"`);
        await queryRunner.query(`ALTER TABLE "client_errors" DROP COLUMN "figmaVersion"`);
        await queryRunner.query(`ALTER TABLE "client_errors" DROP COLUMN "platform"`);
        await queryRunner.query(`ALTER TABLE "client_errors" DROP COLUMN "browserInfo"`);
        await queryRunner.query(`ALTER TABLE "client_errors" DROP COLUMN "componentName"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_errors" ADD "componentName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "client_errors" ADD "browserInfo" text`);
        await queryRunner.query(`ALTER TABLE "client_errors" ADD "platform" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "client_errors" ADD "figmaVersion" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "client_errors" ADD "pluginVersion" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "client_errors" ADD "errorStack" text`);
        await queryRunner.query(`ALTER TABLE "client_errors" ADD "errorCode" character varying(100)`);
        await queryRunner.query(`CREATE INDEX "IDX_9a93dcdcaca440fc60c7bbd283" ON "client_errors" ("errorCode") `);
    }

}
