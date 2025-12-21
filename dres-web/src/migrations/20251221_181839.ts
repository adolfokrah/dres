import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "post_categories_breadcrumbs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "post_categories_breadcrumbs" CASCADE;
  ALTER TABLE "post_categories" DROP CONSTRAINT "post_categories_parent_id_post_categories_id_fk";
  
  DROP INDEX "post_categories_parent_idx";
  ALTER TABLE "categories_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brands_id" integer;
  CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_rels_brands_id_idx" ON "categories_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  ALTER TABLE "post_categories" DROP COLUMN "parent_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "post_categories_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"doc_id" integer,
  	"url" varchar,
  	"label" varchar
  );
  
  ALTER TABLE "brands" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "brands" CASCADE;
  ALTER TABLE "categories_rels" DROP CONSTRAINT "categories_rels_brands_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brands_fk";
  
  DROP INDEX "categories_rels_brands_id_idx";
  DROP INDEX "payload_locked_documents_rels_brands_id_idx";
  ALTER TABLE "post_categories" ADD COLUMN "parent_id" integer;
  ALTER TABLE "post_categories_breadcrumbs" ADD CONSTRAINT "post_categories_breadcrumbs_doc_id_post_categories_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "post_categories_breadcrumbs" ADD CONSTRAINT "post_categories_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."post_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "post_categories_breadcrumbs_order_idx" ON "post_categories_breadcrumbs" USING btree ("_order");
  CREATE INDEX "post_categories_breadcrumbs_parent_id_idx" ON "post_categories_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX "post_categories_breadcrumbs_doc_idx" ON "post_categories_breadcrumbs" USING btree ("doc_id");
  ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_parent_id_post_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "post_categories_parent_idx" ON "post_categories" USING btree ("parent_id");
  ALTER TABLE "categories_rels" DROP COLUMN "brands_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brands_id";`)
}
