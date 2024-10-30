import socket from "./connect";

export function registerListeners(handlers) {
  return new Promise((resolve) => {
    if (handlers.user) {
      socket.on("user", (data) => {
        handlers.user(data);
        resolve();
      });
    }
    if (handlers.new_enemy) {
      socket.on("new_enemy", handlers.new_enemy)
    }

    if (handlers.player_move) {
      socket.on("player_move", handlers.player_move);
    }

    if (handlers.new_bullet) {
      socket.on("new_bullet", handlers.new_bullet);
    }

    if (handlers.user_die_update) {
      socket.on("user_die_update", handlers.user_die_update);
    }
    if (handlers.new_life) {
      socket.on("new_life", handlers.new_life);
    }

    if (handlers.user_update) {
      socket.on("user_update", handlers.user_update);
    }

    if (handlers.user_disconnect) {
      socket.on("user_disconnect", handlers.user_disconnect);
    }

    if (handlers.start) {
      socket.on("start", handlers.start)
    }
  });
}
