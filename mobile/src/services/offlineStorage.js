import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX =
  "@gorev_takip_offline";

const KEYS = {
  user: `${PREFIX}:user`,
  boards: `${PREFIX}:boards`,
  reminders: `${PREFIX}:reminders`,
  queue: `${PREFIX}:queue`,
  idMap: `${PREFIX}:id_map`,
};

let tempCounter = 0;

function listsKey(boardId) {
  return `${PREFIX}:lists:${boardId}`;
}

function tasksKey(listId) {
  return `${PREFIX}:tasks:${listId}`;
}

function commentsKey(taskId) {
  return `${PREFIX}:comments:${taskId}`;
}

function membersKey(boardId) {
  return `${PREFIX}:members:${boardId}`;
}

function assignableUsersKey(
  boardId
) {
  return `${PREFIX}:assignable:${boardId}`;
}

async function readJson(
  key,
  fallback
) {
  try {
    const raw =
      await AsyncStorage.getItem(
        key
      );

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.log(
      "Offline veri okunamadı:",
      key,
      error
    );

    return fallback;
  }
}

async function writeJson(
  key,
  value
) {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.log(
      "Offline veri kaydedilemedi:",
      key,
      error
    );
  }
}

export function createTempId() {
  tempCounter += 1;

  return -(
    Date.now() * 100 +
    tempCounter
  );
}

export async function cacheUser(
  user
) {
  await writeJson(
    KEYS.user,
    user
  );
}

export async function getCachedUser() {
  return readJson(
    KEYS.user,
    null
  );
}

export async function cacheBoards(
  boards
) {
  await writeJson(
    KEYS.boards,
    boards
  );
}

export async function getCachedBoards() {
  return readJson(
    KEYS.boards,
    []
  );
}

export async function cacheLists(
  boardId,
  lists
) {
  await writeJson(
    listsKey(boardId),
    lists
  );
}

export async function getCachedLists(
  boardId
) {
  return readJson(
    listsKey(boardId),
    []
  );
}

export async function cacheTasks(
  listId,
  tasks
) {
  await writeJson(
    tasksKey(listId),
    tasks
  );
}

export async function getCachedTasks(
  listId
) {
  return readJson(
    tasksKey(listId),
    []
  );
}

export async function cacheComments(
  taskId,
  comments
) {
  await writeJson(
    commentsKey(taskId),
    comments
  );
}

export async function getCachedComments(
  taskId
) {
  return readJson(
    commentsKey(taskId),
    []
  );
}

export async function cacheBoardMembers(
  boardId,
  members
) {
  await writeJson(
    membersKey(boardId),
    members
  );
}

export async function getCachedBoardMembers(
  boardId
) {
  return readJson(
    membersKey(boardId),
    []
  );
}

export async function cacheAssignableUsers(
  boardId,
  users
) {
  await writeJson(
    assignableUsersKey(
      boardId
    ),
    users
  );
}

export async function getCachedAssignableUsers(
  boardId
) {
  return readJson(
    assignableUsersKey(
      boardId
    ),
    []
  );
}

export async function cacheReminders(
  reminders
) {
  await writeJson(
    KEYS.reminders,
    reminders
  );
}

export async function getCachedReminders() {
  return readJson(
    KEYS.reminders,
    []
  );
}

export async function getMutationQueue() {
  return readJson(
    KEYS.queue,
    []
  );
}

export async function setMutationQueue(
  queue
) {
  await writeJson(
    KEYS.queue,
    queue
  );
}

export async function addMutationToQueue(
  mutation
) {
  const queue =
    await getMutationQueue();

  const item = {
    id:
      `${Date.now()}-${Math.random()}`,

    createdAt:
      new Date().toISOString(),

    ...mutation,
  };

  queue.push(item);

  await setMutationQueue(
    queue
  );

  return item;
}

async function getIdMap() {
  return readJson(
    KEYS.idMap,
    {}
  );
}

export async function saveIdMapping(
  tempId,
  realId
) {
  const map =
    await getIdMap();

  map[String(tempId)] =
    Number(realId);

  await writeJson(
    KEYS.idMap,
    map
  );
}

export async function resolveStoredId(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  const map =
    await getIdMap();

  let current =
    value;

  let guard = 0;

  while (
    map[
      String(current)
    ] !== undefined &&
    guard < 20
  ) {
    current =
      map[
        String(current)
      ];

    guard += 1;
  }

  return current;
}

function deepReplace(
  value,
  tempId,
  realEntity
) {
  const realId =
    Number(
      realEntity.id
    );

  if (
    typeof value ===
      "number" &&
    value ===
      Number(tempId)
  ) {
    return realId;
  }

  if (
    typeof value ===
      "string" &&
    value ===
      String(tempId)
  ) {
    return String(
      realId
    );
  }

  if (
    Array.isArray(value)
  ) {
    return value.map(
      (item) =>
        deepReplace(
          item,
          tempId,
          realEntity
        )
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const result = {};

    for (
      const [
        key,
        child,
      ] of Object.entries(
        value
      )
    ) {
      result[key] =
        deepReplace(
          child,
          tempId,
          realEntity
        );
    }

    if (
      Number(
        value.id
      ) ===
      Number(tempId)
    ) {
      return {
        ...result,
        ...realEntity,
      };
    }

    return result;
  }

  return value;
}

export async function replaceTempIdEverywhere(
  tempId,
  realEntity
) {
  const realId =
    Number(
      realEntity.id
    );

  await saveIdMapping(
    tempId,
    realId
  );

  const allKeys =
    await AsyncStorage.getAllKeys();

  const offlineKeys =
    allKeys.filter(
      (key) =>
        key.startsWith(
          PREFIX
        )
    );

  for (
    const key of offlineKeys
  ) {
    const raw =
      await AsyncStorage.getItem(
        key
      );

    if (!raw) {
      continue;
    }

    let parsed;

    try {
      parsed =
        JSON.parse(raw);
    } catch {
      continue;
    }

    const replaced =
      deepReplace(
        parsed,
        tempId,
        realEntity
      );

    const suffix =
      `:${tempId}`;

    let targetKey =
      key;

    if (
      key.endsWith(
        suffix
      )
    ) {
      targetKey =
        `${key.slice(
          0,
          -suffix.length
        )}:${realId}`;
    }

    await AsyncStorage.setItem(
      targetKey,
      JSON.stringify(
        replaced
      )
    );

    if (
      targetKey !== key
    ) {
      await AsyncStorage.removeItem(
        key
      );
    }
  }
}

export async function clearOfflineData() {
  const allKeys =
    await AsyncStorage.getAllKeys();

  const offlineKeys =
    allKeys.filter(
      (key) =>
        key.startsWith(
          PREFIX
        )
    );

  if (
    offlineKeys.length >
    0
  ) {
    await AsyncStorage.multiRemove(
      offlineKeys
    );
  }
}