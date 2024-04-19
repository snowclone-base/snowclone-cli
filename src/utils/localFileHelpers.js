import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import * as directories from "./directories.js"

export function saveInfoForProjects(bucketName, region, domain, subnetAid, subnetBid, route53ZoneId) {
  const data = { bucketName, region, domain, subnetAid, subnetBid, route53ZoneId };
  fs.mkdirSync(directories.appDir, { recursive: true });
  const fileName = path.join(directories.appDir, "S3.json");

  fs.writeFile(fileName, JSON.stringify(data), (err) => {
    if (err) {
      console.error(err);
    }
  });
}

export function getInfoForProjects() {
  const s3File = path.join(directories.appDir, "S3.json");
  const data = fs.readFileSync(s3File, "utf8");
  return JSON.parse(data);
}

export function getTfOutputs(directory) {
  const tfOutputs = execSync("terraform output -json", {
    cwd: directory,
  }).toString();
  const subnetAid = JSON.parse(tfOutputs).private_subnet_a_id.value;
  const subnetBid = JSON.parse(tfOutputs).private_subnet_b_id.value;
  const route53ZoneId = JSON.parse(tfOutputs).aws_route53_zone_id.value;
  return { subnetAid, subnetBid, route53ZoneId };
}