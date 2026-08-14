const { Dropbox } = require('dropbox');

const env = require('../config/env');

let dropboxClient = null;

/**
 * Create Dropbox client.
 *
 * The refresh token allows the backend to obtain
 * fresh short-lived access tokens automatically.
 */
function getDropboxClient() {
  if (!dropboxClient) {
    if (
      !env.dropbox.appKey ||
      !env.dropbox.appSecret ||
      !env.dropbox.refreshToken
    ) {
      throw new Error(
        'Dropbox environment variables are missing.',
      );
    }

    dropboxClient = new Dropbox({
      clientId: env.dropbox.appKey,
      clientSecret: env.dropbox.appSecret,
      refreshToken: env.dropbox.refreshToken,
    });
  }

  return dropboxClient;
}

/**
 * List a Dropbox folder.
 */
async function listFolder(path) {
  const dbx = getDropboxClient();

  let result = await dbx.filesListFolder({
    path,
    recursive: false,
  });

  let entries = [...result.result.entries];

  while (result.result.has_more) {
    result = await dbx.filesListFolderContinue({
      cursor: result.result.cursor,
    });

    entries = [
      ...entries,
      ...result.result.entries,
    ];
  }

  return entries;
}

/**
 * List all files recursively.
 */
async function listFolderRecursive(path) {
  const dbx = getDropboxClient();

  let result = await dbx.filesListFolder({
    path,
    recursive: true,
  });

  let entries = [...result.result.entries];

  while (result.result.has_more) {
    result = await dbx.filesListFolderContinue({
      cursor: result.result.cursor,
    });

    entries = [
      ...entries,
      ...result.result.entries,
    ];
  }

  return entries;
}

/**
 * Get existing shared links for a Dropbox file.
 */
async function getSharedLinks(path) {
  const dbx = getDropboxClient();

  try {
    const result =
      await dbx.sharingListSharedLinks({
        path,
        direct_only: true,
      });

    return result.result.links || [];
  } catch (error) {
    console.error(
      'Error getting shared links:',
      error?.error?.error_summary ||
        error.message,
    );

    return [];
  }
}

/**
 * Create a public shared link.
 *
 * We first check whether a link already exists.
 */
async function getOrCreateSharedLink(path) {
  const dbx = getDropboxClient();

  // Check existing links
  const existing =
    await getSharedLinks(path);

  if (existing.length > 0) {
    return convertDropboxLink(
      existing[0].url,
    );
  }

  try {
    const result =
      await dbx.sharingCreateSharedLinkWithSettings({
        path,
      });

    return convertDropboxLink(
      result.result.url,
    );
  } catch (error) {
    console.error(
      'Error creating shared link:',
      error?.error?.error_summary ||
        error.message,
    );

    return null;
  }
}

/**
 * Convert Dropbox preview link to a direct
 * browser-friendly link.
 */
function convertDropboxLink(url) {
  if (!url) {
    return null;
  }

  return url
    .replace(
      'www.dropbox.com',
      'dl.dropboxusercontent.com',
    )
    .replace('?dl=0', '')
    .replace('&dl=0', '');
}

/**
 * Determine file type.
 */
function getFileType(name) {
  const extension =
    name
      .split('.')
      .pop()
      ?.toLowerCase() || '';

  const images = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif',
    'avif',
  ];

  const videos = [
    'mp4',
    'webm',
    'mov',
    'm4v',
  ];

  if (images.includes(extension)) {
    return 'image';
  }

  if (videos.includes(extension)) {
    return 'video';
  }

  return 'file';
}

/**
 * Get file extension.
 */
function getExtension(name) {
  return (
    name
      .split('.')
      .pop()
      ?.toLowerCase() || ''
  );
}

/**
 * Build portfolio projects from Dropbox.
 *
 * Expected Dropbox structure:
 *
 * /THEVA_PORTFOLIO
 *
 *   /WEBSITE
 *      /Project One
 *          thumbnail.jpg
 *          project.mp4
 *
 *   /APP
 *      /Project Two
 *          thumbnail.jpg
 *          project.mp4
 *
 *   /LOGO
 *      /Project Three
 *          thumbnail.png
 *
 *   /VIDEO
 *      /Project Four
 *          thumbnail.jpg
 *          project.mp4
 *
 *   /GRAPHIC_DESIGNS
 *      /Project Five
 *          thumbnail.jpg
 */
async function getPortfolio() {
  const root =
    env.dropbox.portfolioPath;

  const categories =
    await listFolder(root);

  const folders =
    categories.filter(
      (entry) =>
        entry['.tag'] === 'folder',
    );

  const projects = [];

  for (const categoryFolder of folders) {
    const category =
      categoryFolder.name
        .toUpperCase();

    const projectFolders =
      await listFolder(
        categoryFolder.path_lower,
      );

    for (
      const projectFolder
      of projectFolders
    ) {
      if (
        projectFolder['.tag'] !==
        'folder'
      ) {
        continue;
      }

      const projectFiles =
        await listFolder(
          projectFolder.path_lower,
        );

      let thumbnail = null;
      let videoUrl = null;

      const otherFiles = [];

      for (
        const file
        of projectFiles
      ) {
        if (
          file['.tag'] !==
          'file'
        ) {
          continue;
        }

        const extension =
          getExtension(
            file.name,
          );

        const fileType =
          getFileType(
            file.name,
          );

        const url =
          await getOrCreateSharedLink(
            file.path_lower,
          );

        if (!url) {
          continue;
        }

        // Thumbnail
        if (
          !thumbnail &&
          fileType === 'image'
        ) {
          thumbnail = url;
          continue;
        }

        // Video
        if (
          !videoUrl &&
          fileType === 'video'
        ) {
          videoUrl = url;
          continue;
        }

        otherFiles.push({
          name: file.name,
          url,
          type: fileType,
          extension,
        });
      }

      projects.push({
        id: projectFolder.id,

        title:
          projectFolder.name,

        category,

        thumbnail,

        videoUrl,

        files: otherFiles,

        path:
          projectFolder.path_display,

        isFeatured: false,
      });
    }
  }

  return projects;
}

/**
 * Get Dropbox account information.
 */
async function getAccountInfo() {
  const dbx =
    getDropboxClient();

  const result =
    await dbx.usersGetCurrentAccount();

  return result.result;
}

module.exports = {
  getDropboxClient,
  listFolder,
  listFolderRecursive,
  getSharedLinks,
  getOrCreateSharedLink,
  getPortfolio,
  getAccountInfo,
};