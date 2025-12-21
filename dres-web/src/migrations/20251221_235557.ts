import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_condition" AS ENUM('new_with_tags', 'new_without_tags', 'like_new', 'good', 'fair');
  CREATE TABLE "materials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "materials_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  ALTER TABLE "products" ADD COLUMN "condition" "enum_products_condition" NOT NULL;
  ALTER TABLE "products" ADD COLUMN "material_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "materials_id" integer;
  ALTER TABLE "materials_rels" ADD CONSTRAINT "materials_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "materials_rels" ADD CONSTRAINT "materials_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "materials_name_idx" ON "materials" USING btree ("name");
  CREATE INDEX "materials_updated_at_idx" ON "materials" USING btree ("updated_at");
  CREATE INDEX "materials_created_at_idx" ON "materials" USING btree ("created_at");
  CREATE INDEX "materials_rels_order_idx" ON "materials_rels" USING btree ("order");
  CREATE INDEX "materials_rels_parent_idx" ON "materials_rels" USING btree ("parent_id");
  CREATE INDEX "materials_rels_path_idx" ON "materials_rels" USING btree ("path");
  CREATE INDEX "materials_rels_categories_id_idx" ON "materials_rels" USING btree ("categories_id");
  ALTER TABLE "products" ADD CONSTRAINT "products_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_material_idx" ON "products" USING btree ("material_id");
  CREATE INDEX "payload_locked_documents_rels_materials_id_idx" ON "payload_locked_documents_rels" USING btree ("materials_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "materials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "materials_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "materials" CASCADE;
  DROP TABLE "materials_rels" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_material_id_materials_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_materials_fk";
  
  DROP INDEX "products_material_idx";
  DROP INDEX "payload_locked_documents_rels_materials_id_idx";
  ALTER TABLE "products" DROP COLUMN "condition";
  ALTER TABLE "products" DROP COLUMN "material_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "materials_id";
  DROP TYPE "public"."enum_products_condition";`)
}
