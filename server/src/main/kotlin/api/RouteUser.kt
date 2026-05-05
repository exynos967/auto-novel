package api

import api.plugins.authenticateDb
import api.plugins.user
import infra.user.UserFavoredList
import infra.user.UserFavoredRepository
import infra.user.UserRepository
import io.ktor.resources.*
import io.ktor.server.request.*
import io.ktor.server.resources.*
import io.ktor.server.resources.put
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.koin.ktor.ext.inject

@Resource("/user")
private class UserRes {
    @Resource("/favored")
    class Favored(val parent: UserRes)

    @Resource("/setting/{key}")
    class Setting(
        val parent: UserRes,
        val key: String,
    )
}

fun Route.routeUser() {
    val service by inject<UserApi>()

    authenticateDb {
        get<UserRes.Favored> {
            val user = call.user()
            call.tryRespond {
                service.listFavored(user.id)
            }
        }
        get<UserRes.Setting> { loc ->
            val user = call.user()
            call.tryRespond {
                service.getSetting(user.id, loc.key)
            }
        }
        put<UserRes.Setting> { loc ->
            @Serializable
            data class Body(val value: String)

            val user = call.user()
            val body = call.receive<Body>()
            call.tryRespond {
                service.updateSetting(user.id, loc.key, body.value)
            }
        }
    }
}

class UserApi(
    private val userFavoredRepo: UserFavoredRepository,
    private val userRepo: UserRepository,
) {
    private val maxSettingValueSize = 8 * 1024 * 1024
    private val settingKeyPattern = Regex("[A-Za-z0-9_-]+")

    suspend fun listFavored(userId: String): UserFavoredList {
        return userFavoredRepo.getFavoredList(userId)
            ?: throwNotFound("用户不存在")
    }

    suspend fun getSetting(userId: String, key: String): String {
        validateSettingKey(key)
        return userRepo.getSettings(userId)[key]
            ?: throwNotFound("设置不存在")
    }

    suspend fun updateSetting(userId: String, key: String, value: String) {
        validateSettingKey(key)
        if (value.length > maxSettingValueSize) throwBadRequest("设置内容过大")
        userRepo.updateSetting(userId, key, value)
    }

    private fun validateSettingKey(key: String) {
        if (key.length > 64) throwBadRequest("设置键过长")
        if (!settingKeyPattern.matches(key)) throwBadRequest("设置键格式不合法")
    }
}
