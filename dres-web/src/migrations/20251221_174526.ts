import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "variant_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "variant_options" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant_type_id" integer NOT NULL,
  	"label" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "variant_options_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "variant_types_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "variant_options_id" integer;
  ALTER TABLE "variant_options" ADD CONSTRAINT "variant_options_variant_type_id_variant_types_id_fk" FOREIGN KEY ("variant_type_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variant_options_rels" ADD CONSTRAINT "variant_options_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_options_rels" ADD CONSTRAINT "variant_options_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "variant_types_updated_at_idx" ON "variant_types" USING btree ("updated_at");
  CREATE INDEX "variant_types_created_at_idx" ON "variant_types" USING btree ("created_at");
  CREATE INDEX "variant_options_variant_type_idx" ON "variant_options" USING btree ("variant_type_id");
  CREATE UNIQUE INDEX "variant_options_slug_idx" ON "variant_options" USING btree ("slug");
  CREATE INDEX "variant_options_updated_at_idx" ON "variant_options" USING btree ("updated_at");
  CREATE INDEX "variant_options_created_at_idx" ON "variant_options" USING btree ("created_at");
  CREATE INDEX "variant_options_rels_order_idx" ON "variant_options_rels" USING btree ("order");
  CREATE INDEX "variant_options_rels_parent_idx" ON "variant_options_rels" USING btree ("parent_id");
  CREATE INDEX "variant_options_rels_path_idx" ON "variant_options_rels" USING btree ("path");
  CREATE INDEX "variant_options_rels_categories_id_idx" ON "variant_options_rels" USING btree ("categories_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_variant_types_id_idx" ON "payload_locked_documents_rels" USING btree ("variant_types_id");
  CREATE INDEX "payload_locked_documents_rels_variant_options_id_idx" ON "payload_locked_documents_rels" USING btree ("variant_options_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "variant_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "variant_options_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "variant_types" CASCADE;
  DROP TABLE "variant_options" CASCADE;
  DROP TABLE "variant_options_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_variant_types_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_variant_options_fk";
  
  DROP INDEX "payload_locked_documents_rels_variant_types_id_idx";
  DROP INDEX "payload_locked_documents_rels_variant_options_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "variant_types_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "variant_options_id";`)
}
