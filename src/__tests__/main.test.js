import { listProjects } from "../main.js";
import { jest } from '@jest/globals';

import * as awsHelpers from "../awsHelpers.js";

jest.mock("../awsHelpers.js", () => ({
  ...jest.requireActual("../awsHelpers.js"),
  getAllProjects: jest.fn(() => [{ name: "Project1" }])
}));


// jest.mock("../awsHelpers.js", () => 
//   {
//     return {
//       __esModule: true,
//       getAllProjects: jest.fn(() => [{ name: 'Project1' }])
//     };
//   }
// );
console.log("getAllProjects: ", getAllProjects())
// getAllProjects = jest.fn().mockResolvedValue([{ name: "Project1" }]);

describe('listProjects function', () => {
  it('should log active projects when projects exist', async () => {

    const consoleSpy = jest.spyOn(console, 'log');

    await listProjects();

    expect(consoleSpy).toHaveBeenCalledWith('Active Projects: ');
    expect(consoleSpy).toHaveBeenCalledWith('Project1');

    consoleSpy.mockRestore();
  });
});
