import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1764500056682 implements MigrationInterface {
    name = 'Migrations1764500056682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "design_versions" ("id" SERIAL NOT NULL, "version" integer NOT NULL, "description" text NOT NULL, "designJson" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b345ead815e872449e8d358f317" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "design_versions"`);
    }

}
